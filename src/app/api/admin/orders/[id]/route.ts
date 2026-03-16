import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;

    // 1. Fetch Order with Client details
    const [orders]: any = await pool.query(`
      SELECT
        o.*,
        c.name as client_db_name,
        c.email as client_db_email,
        c.phone as client_db_phone,
        coupons.code as coupon_code
      FROM cart_orders o
      LEFT JOIN clients c ON o.client_id = c.id
      LEFT JOIN coupons ON o.coupon_id = coupons.id
      WHERE o.id = ?
    `, [orderId]);

    if (orders.length === 0) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const order = orders[0];

    // 2. Fetch Items
    const [items]: any = await pool.query(`
      SELECT * FROM cart_order_items WHERE order_id = ?
    `, [orderId]);

    return NextResponse.json({ ...order, items });
  } catch (error: any) {
    console.error("Error fetching admin order detail:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;
    const {
      status, shipping_tracking_code, notes,
      client_name, client_email, client_phone, client_document,
      client_zipcode, client_address, client_number, client_complement
    } = await req.json();

    const allowedStatuses = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    await pool.query(`
      UPDATE cart_orders
      SET
        status = COALESCE(?, status),
        shipping_tracking_code = COALESCE(?, shipping_tracking_code),
        notes = COALESCE(?, notes),
        client_name = COALESCE(?, client_name),
        client_email = COALESCE(?, client_email),
        client_phone = COALESCE(?, client_phone),
        client_document = COALESCE(?, client_document),
        client_zipcode = COALESCE(?, client_zipcode),
        client_address = COALESCE(?, client_address),
        client_number = COALESCE(?, client_number),
        client_complement = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      status, shipping_tracking_code, notes,
      client_name, client_email, client_phone, client_document,
      client_zipcode, client_address, client_number, client_complement,
      orderId
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating admin order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;

    // First delete items to avoid constraint failure
    await pool.query(`DELETE FROM cart_order_items WHERE order_id = ?`, [orderId]);

    // Then delete the order itself
    await pool.query(`DELETE FROM cart_orders WHERE id = ?`, [orderId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting admin order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
