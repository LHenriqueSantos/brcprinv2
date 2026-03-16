import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkSellerOrAdmin, forbiddenResponse } from "@/lib/adminCheck";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!await checkSellerOrAdmin()) return forbiddenResponse();

    const [orders]: any = await pool.query(`
      SELECT
        o.*,
        c.name as client_db_name,
        c.email as client_db_email
      FROM cart_orders o
      LEFT JOIN clients c ON o.client_id = c.id
      ORDER BY o.created_at DESC
    `);

    // Fetch item counts for each order
    for (const order of orders) {
      const [items]: any = await pool.query("SELECT COUNT(*) as count FROM cart_order_items WHERE order_id = ?", [order.id]);
      order.item_count = items[0].count;
    }

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Error fetching admin cart orders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
