import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "3306"),
});

// Helper to determine MelhorEnvio endpoint based on environment
const getApiUrl = (env: string) => env === 'production'
  ? 'https://www.melhorenvio.com.br/api/v2/me'
  : 'https://sandbox.melhorenvio.com.br/api/v2/me';

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const qId = url.searchParams.get("quoteId");
    const oId = url.searchParams.get("orderId");

    let body: any = {};
    try { body = await req.json(); } catch (e) { }

    const quoteId = qId || body.quoteId;
    const cartOrderId = oId || body.orderId;

    if (!quoteId && !cartOrderId) {
      return NextResponse.json({ error: "Quote ID or Order ID is required" }, { status: 400 });
    }

    // Fetch config for token
    const [configRows]: any = await pool.query("SELECT melhorenvio_token FROM business_config WHERE id = 1");
    if (!configRows.length || !configRows[0].melhorenvio_token) {
      return NextResponse.json({ error: "Melhor Envio token not configured" }, { status: 400 });
    }
    const token = configRows[0].melhorenvio_token;

    let shippingData: any = null;
    let dbUpdateTable = "";
    let dbUpdateId = 0;

    if (quoteId) {
      const [quoteRows]: any = await pool.query(`
        SELECT q.*, c.name as client_name, c.document as client_doc, c.email as client_email, c.phone as client_phone, q.final_price as total_price
        FROM quotes q
        JOIN clients c ON q.client_id = c.id
        WHERE q.id = ?`, [quoteId]);

      if (!quoteRows.length) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      shippingData = quoteRows[0];
      dbUpdateTable = "quotes";
      dbUpdateId = quoteId;
    } else {
      const [orderRows]: any = await pool.query(`
        SELECT * FROM cart_orders WHERE id = ?`, [cartOrderId]);

      if (!orderRows.length) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      shippingData = orderRows[0];
      // Note: orderRows already contains client_name, etc. snapshot
      shippingData.total_price = orderRows[0].total;
      dbUpdateTable = "cart_orders";
      dbUpdateId = cartOrderId;
    }

    // 2. Map Service ID
    let serviceId = 1; // Default
    const shippingService = shippingData.shipping_service?.toLowerCase() || '';
    if (shippingService.includes('sedex')) serviceId = 2;

    const width = 20, height = 20, length = 20, weight = 1;
    const apiUrl = getApiUrl('production');

    // 3. Cart Payload
    const cartPayload = {
      service: serviceId,
      agency: 1,
      from: {
        name: "BRC Print Flow",
        phone: "11999999999",
        email: "contato@brcprint.com",
        document: "00000000000000",
        address: "Rua Exemplo",
        number: "123",
        district: "Centro",
        city: "São Paulo",
        state_abbr: "SP",
        country_id: "BR",
        postal_code: "01001000"
      },
      to: {
        name: shippingData.client_name,
        phone: shippingData.client_phone || "11999999999",
        email: shippingData.client_email || "cliente@email.com",
        document: shippingData.client_document || shippingData.client_doc || "00000000000",
        address: shippingData.client_address,
        number: shippingData.client_number || shippingData.address_number,
        complement: shippingData.client_complement || "",
        district: shippingData.client_neighborhood || "Centro",
        city: shippingData.client_city,
        state_abbr: shippingData.client_state?.substr(0, 2).toUpperCase(),
        country_id: "BR",
        postal_code: shippingData.client_zipcode.replace(/\D/g, '')
      },
      products: [
        {
          name: "Serviço de Impressão 3D",
          quantity: 1,
          unitary_value: parseFloat(shippingData.total_price)
        }
      ],
      volumes: [{ height, width, length, weight }],
      options: {
        insurance_value: parseFloat(shippingData.total_price),
        non_commercial: true
      }
    };

    const cartRes = await fetch(`${apiUrl}/cart`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(cartPayload)
    });

    if (!cartRes.ok) return NextResponse.json({ error: `ME Cart Error: ${await cartRes.text()}` }, { status: cartRes.status });

    const cartData = await cartRes.json();
    const meOrderId = cartData.id;

    // Checkout
    const checkoutRes = await fetch(`${apiUrl}/shipment/checkout`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ orders: [meOrderId] })
    });

    if (!checkoutRes.ok) return NextResponse.json({ error: `ME Checkout Error: ${await checkoutRes.text()}` }, { status: checkoutRes.status });

    // Generate Label
    await fetch(`${apiUrl}/shipment/generate`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ orders: [meOrderId] })
    });

    // Update DB
    await pool.query(
      `UPDATE ${dbUpdateTable} SET melhorenvio_order_id = ? WHERE id = ?`,
      [meOrderId, dbUpdateId]
    );

    return NextResponse.json({ success: true, meOrderId });

  } catch (error: any) {
    console.error("MelhorEnvio Buy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
