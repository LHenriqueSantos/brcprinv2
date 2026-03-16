import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      name, brand, type, color, lot_number, roll_number, purchase_date,
      cost_per_kg, density_g_cm3, active, initial_weight_g, current_weight_g, min_stock_warning, total_purchased_g
    } = body;
    await pool.query(
      `UPDATE filaments SET
        name=?, brand=?, type=?, color=?, lot_number=?, roll_number=?, purchase_date=?,
        cost_per_kg=?, density_g_cm3=?, active=?, initial_weight_g=?, current_weight_g=?, min_stock_warning=?, total_purchased_g=?
      WHERE id=?`,
      [
        name, brand, type, color, lot_number || null, roll_number || null, purchase_date || null,
        cost_per_kg, density_g_cm3, active ?? 1, initial_weight_g ?? 1000, current_weight_g ?? 1000, min_stock_warning ?? 100, total_purchased_g ?? 1000, id
      ]
    );
    const [rows] = await pool.query("SELECT * FROM filaments WHERE id = ?", [id]);
    return NextResponse.json((rows as any[])[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await pool.query("UPDATE filaments SET active = 0 WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
