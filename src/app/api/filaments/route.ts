import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM filaments WHERE active = 1 ORDER BY type, name");
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name, brand, type, color, lot_number, roll_number, purchase_date,
      cost_per_kg, density_g_cm3, initial_weight_g, current_weight_g, min_stock_warning, total_purchased_g
    } = body;
    const [result] = await pool.query(
      `INSERT INTO filaments (
        name, brand, type, color, lot_number, roll_number, purchase_date,
        cost_per_kg, density_g_cm3, initial_weight_g, current_weight_g, min_stock_warning, total_purchased_g
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        brand,
        type,
        color,
        lot_number || null,
        roll_number || null,
        purchase_date || null,
        cost_per_kg,
        density_g_cm3 || 1.24,
        initial_weight_g ?? 1000,
        current_weight_g ?? initial_weight_g ?? 1000,
        min_stock_warning ?? 100,
        total_purchased_g ?? initial_weight_g ?? 1000
      ]
    );
    const id = (result as any).insertId;
    const [rows] = await pool.query("SELECT * FROM filaments WHERE id = ?", [id]);
    return NextResponse.json((rows as any[])[0], { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
