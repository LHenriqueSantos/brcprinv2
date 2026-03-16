import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkOperatorOrAdmin, forbiddenResponse } from "@/lib/adminCheck";

export async function GET(req: Request) {
  if (!await checkOperatorOrAdmin()) return forbiddenResponse();

  try {
    const { searchParams } = new URL(req.url);
    const filamentId = searchParams.get("filamentId");

    let query = "SELECT * FROM filament_lots";
    const params = [];

    if (filamentId) {
      query += " WHERE filament_id = ?";
      params.push(filamentId);
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!await checkOperatorOrAdmin()) return forbiddenResponse();

  try {
    const body = await req.json();
    const { filament_id, lot_number, roll_number, purchase_date, initial_weight_g, cost_per_kg } = body;

    if (!filament_id || !lot_number || !cost_per_kg) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [result] = await pool.query(
      `INSERT INTO filament_lots (filament_id, lot_number, roll_number, purchase_date, initial_weight_g, current_weight_g, cost_per_kg)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [filament_id, lot_number, roll_number || null, purchase_date || null, initial_weight_g || 1000, initial_weight_g || 1000, cost_per_kg]
    );

    const id = (result as any).insertId;

    // Update parent filament stock
    await pool.query(
      `UPDATE filaments
       SET current_weight_g = current_weight_g + ?,
           total_purchased_g = total_purchased_g + ?
       WHERE id = ?`,
      [initial_weight_g || 1000, initial_weight_g || 1000, filament_id]
    );

    const [rows] = await pool.query("SELECT * FROM filament_lots WHERE id = ?", [id]);

    return NextResponse.json((rows as any[])[0], { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
