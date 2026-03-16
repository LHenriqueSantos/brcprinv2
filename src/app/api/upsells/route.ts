import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkAnyAuth, checkSellerOrAdmin, forbiddenResponse } from "@/lib/adminCheck";

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await checkAnyAuth()) return forbiddenResponse();
  try {
    const [rows] = await pool.query("SELECT * FROM upsell_options ORDER BY name ASC");
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!await checkSellerOrAdmin()) return forbiddenResponse();
  try {
    const body = await req.json();
    const { name, description, charge_type, charge_value, per_unit, active } = body;

    if (!name || isNaN(Number(charge_value))) {
      return NextResponse.json({ error: "Nome e Valor (Numérico) são obrigatórios" }, { status: 400 });
    }

    const [result] = await pool.query(
      `INSERT INTO upsell_options (name, description, charge_type, charge_value, per_unit, active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description || null, charge_type || 'fixed', Number(charge_value), per_unit !== undefined ? per_unit : true, active !== undefined ? active : true]
    );

    return NextResponse.json({ id: (result as any).insertId, name });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
