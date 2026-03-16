import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkSellerOrAdmin, forbiddenResponse } from "@/lib/adminCheck";

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkSellerOrAdmin()) return forbiddenResponse();
  try {
    const { id } = await params;
    const body = await req.json();

    if (Object.keys(body).length === 1 && body.hasOwnProperty('active')) {
      const { active } = body;
      await pool.query("UPDATE upsell_options SET active = ? WHERE id = ?", [active ? 1 : 0, id]);
    } else {
      const { name, description, charge_type, charge_value, per_unit } = body;
      await pool.query(
        "UPDATE upsell_options SET name = ?, description = ?, charge_type = ?, charge_value = ?, per_unit = ? WHERE id = ?",
        [name, description, charge_type, charge_value, per_unit ? 1 : 0, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkSellerOrAdmin()) return forbiddenResponse();
  try {
    const { id } = await params;
    await pool.query("DELETE FROM upsell_options WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
