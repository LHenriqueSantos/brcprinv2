import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { publicToken } = await req.json();
    const { id: orderId } = await params;

    if (!publicToken) return NextResponse.json({ error: "Token não fornecido" }, { status: 400 });

    // 1. Fetch Order
    const [orders]: any = await pool.query(
      "SELECT * FROM cart_orders WHERE id = ? AND public_token = ?",
      [orderId, publicToken]
    );

    if (orders.length === 0) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const order = orders[0];

    // 2. Fetch Items
    const [items]: any = await pool.query(
      "SELECT * FROM cart_order_items WHERE order_id = ?",
      [orderId]
    );

    // 3. Configure MercadoPago
    const [configRows]: any = await pool.query("SELECT mp_access_token FROM business_config WHERE id = 1");
    const accessToken = configRows[0]?.mp_access_token || process.env.MP_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json({ error: "MercadoPago não configurado" }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });
    const preference = new Preference(client);

    // 4. Map items to MP format
    const mpItems = items.map((item: any) => ({
      id: String(item.id),
      title: item.title,
      unit_price: Number(item.price),
      quantity: Number(item.quantity),
      currency_id: 'BRL'
    }));

    // Add shipping as an item if exists
    if (order.shipping_cost > 0) {
      mpItems.push({
        id: 'shipping',
        title: `Frete: ${order.shipping_service || 'Entrega'}`,
        unit_price: Number(order.shipping_cost),
        quantity: 1,
        currency_id: 'BRL'
      });
    }

    // Handle discount as a separate item with negative price if possible, or deduct from items.
    // MP usually prefers net totals or specific discount fields in preference.
    // MP REST API strictly forbids negative unit_price. We must apply the discount to the items proportionally.
    // For simplicity, we just reduce the unit price of the first item by the discount amount (ensuring it doesn't go below 0).
    if (order.discount_value > 0 && mpItems.length > 0) {
      if (mpItems[0].unit_price >= order.discount_value) {
        mpItems[0].unit_price -= order.discount_value;
      } else {
        // If discount is bigger than the first item, just set it to a symbolic 0.01
        mpItems[0].unit_price = 0.01;
      }
    }

    // 5. Create Preference
    const response = await preference.create({
      body: {
        items: mpItems,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?order_id=${orderId}`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancelled?order_id=${orderId}`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?order_id=${orderId}`
        },
        auto_return: 'approved',
        external_reference: `CART_${orderId}`,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
        metadata: {
          order_id: orderId,
          type: 'cart_order'
        }
      }
    });

    // 6. Update Order with Preference ID
    await pool.query(
      "UPDATE cart_orders SET mp_preference_id = ? WHERE id = ?",
      [response.id, orderId]
    );

    return NextResponse.json({
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point
    });

  } catch (error: any) {
    console.error("Error creating MP preference:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
