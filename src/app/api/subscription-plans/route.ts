import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const [rows] = await pool.query("SELECT * FROM subscription_plans ORDER BY monthly_price ASC");
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') return NextResponse.json({ error: "Apenas admins" }, { status: 403 });

    const body = await req.json();
    const { name, monthly_price, hours_included, active, filament_type, b2b_filament_cost, grams_included } = body;

    const [result] = await pool.query(
      "INSERT INTO subscription_plans (name, monthly_price, hours_included, active, filament_type, b2b_filament_cost, grams_included) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, monthly_price, hours_included, active ? 1 : 0, filament_type || null, b2b_filament_cost || null, grams_included || 0]
    );

    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') return NextResponse.json({ error: "Apenas admins" }, { status: 403 });

    const body = await req.json();
    const { id, name, monthly_price, hours_included, active, filament_type, b2b_filament_cost, grams_included } = body;

    await pool.query(
      "UPDATE subscription_plans SET name = ?, monthly_price = ?, hours_included = ?, active = ?, filament_type = ?, b2b_filament_cost = ?, grams_included = ? WHERE id = ?",
      [name, monthly_price, hours_included, active ? 1 : 0, filament_type || null, b2b_filament_cost || null, grams_included || 0, id]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') return NextResponse.json({ error: "Apenas admins" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    await pool.query("DELETE FROM subscription_plans WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
