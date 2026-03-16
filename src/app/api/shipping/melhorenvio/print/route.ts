import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "3306"),
});

const getApiUrl = (env: string) => env === 'production'
  ? 'https://www.melhorenvio.com.br/api/v2/me'
  : 'https://sandbox.melhorenvio.com.br/api/v2/me';

export async function POST(req: Request) {
  try {
    const { quoteId, orderId } = await req.json();

    if (!quoteId && !orderId) {
      return NextResponse.json({ error: "Quote ID or Order ID is required" }, { status: 400 });
    }

    const [configRows]: any = await pool.query("SELECT melhorenvio_token FROM business_config WHERE id = 1");
    if (!configRows.length || !configRows[0].melhorenvio_token) {
      return NextResponse.json({ error: "Melhor Envio token not configured" }, { status: 400 });
    }
    const token = configRows[0].melhorenvio_token;

    let melhorenvioOrderId = null;
    let dbUpdateTable = "";
    let dbUpdateId = 0;

    if (quoteId) {
      const [rows]: any = await pool.query("SELECT melhorenvio_order_id FROM quotes WHERE id = ?", [quoteId]);
      if (rows.length && rows[0].melhorenvio_order_id) {
        melhorenvioOrderId = rows[0].melhorenvio_order_id;
        dbUpdateTable = "quotes";
        dbUpdateId = quoteId;
      }
    } else {
      const [rows]: any = await pool.query("SELECT melhorenvio_order_id FROM cart_orders WHERE id = ?", [orderId]);
      if (rows.length && rows[0].melhorenvio_order_id) {
        melhorenvioOrderId = rows[0].melhorenvio_order_id;
        dbUpdateTable = "cart_orders";
        dbUpdateId = orderId;
      }
    }

    if (!melhorenvioOrderId) {
      return NextResponse.json({ error: "Melhor Envio Order ID not found" }, { status: 404 });
    }

    const apiUrl = getApiUrl('production');

    // Generate Print URL
    const printRes = await fetch(`${apiUrl}/shipment/print`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ mode: "public", orders: [melhorenvioOrderId] })
    });

    if (!printRes.ok) return NextResponse.json({ error: `ME Print Error: ${await printRes.text()}` }, { status: printRes.status });

    const printData = await printRes.json();
    const url = printData.url;

    // Optional: Get Tracking Code
    const detailsRes = await fetch(`${apiUrl}/orders/${melhorenvioOrderId}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
    });

    let trackingCode = null;
    if (detailsRes.ok) {
      const detailsData = await detailsRes.json();
      if (detailsData.tracking) {
        trackingCode = detailsData.tracking;
        await pool.query(
          `UPDATE ${dbUpdateTable} SET shipping_tracking_code = ? WHERE id = ?`,
          [trackingCode, dbUpdateId]
        );
      }
    }

    return NextResponse.json({ success: true, print_url: url, tracking_code: trackingCode });

  } catch (error: any) {
    console.error("MelhorEnvio Print Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
