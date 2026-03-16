import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [rows] = await pool.query(
      `SELECT c.*, sp.name as subscription_plan_name
       FROM clients c
       LEFT JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
       WHERE c.id = ?`,
      [id]
    );
    const client = (rows as any[])[0];
    if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    return NextResponse.json(client);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, company, email, phone, notes, discount_margin_pct } = body;
    await pool.query(
      `UPDATE clients SET name=?, company=?, email=?, phone=?, notes=?, discount_margin_pct=? WHERE id=?`,
      [name, company || null, email || null, phone || null, notes || null, discount_margin_pct || 0, id]
    );
    const [rows] = await pool.query("SELECT * FROM clients WHERE id = ?", [id]);
    return NextResponse.json((rows as any[])[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await pool.query("DELETE FROM clients WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
