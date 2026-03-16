import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkOperatorOrAdmin, forbiddenResponse } from "@/lib/adminCheck";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  if (!await checkOperatorOrAdmin()) return forbiddenResponse();

  try {
    const params = await props.params;
    const { id } = params;
    const body = await req.json();
    const { current_weight_g, active } = body;

    let query = "UPDATE filament_lots SET ";
    const values = [];
    const fields = [];

    if (current_weight_g !== undefined) {
      fields.push("current_weight_g = ?");
      values.push(current_weight_g);
    }

    if (active !== undefined) {
      fields.push("active = ?");
      values.push(active ? 1 : 0);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    query += fields.join(", ") + " WHERE id = ?";
    values.push(id);

    await pool.query(query, values);

    const [rows] = await pool.query("SELECT * FROM filament_lots WHERE id = ?", [id]);
    return NextResponse.json((rows as any[])[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  if (!await checkOperatorOrAdmin()) return forbiddenResponse();

  try {
    const params = await props.params;
    const { id } = params;

    await pool.query("DELETE FROM filament_lots WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
