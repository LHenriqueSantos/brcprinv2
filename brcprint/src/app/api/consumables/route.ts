import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const [consumables] = await pool.query(
      "SELECT * FROM consumables WHERE active = 1 ORDER BY category ASC, name ASC"
    );
    return NextResponse.json(consumables);
  } catch (error) {
    console.error("Erro ao buscar consumíveis:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const data = await req.json();
    const { name, category, unit_type, lot_number, roll_number, purchase_date, cost_per_unit, stock_current, stock_min_warning } = data;

    if (!name || !category || !unit_type || cost_per_unit === undefined) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const sql = `
      INSERT INTO consumables
      (name, category, unit_type, lot_number, roll_number, purchase_date, cost_per_unit, stock_current, stock_min_warning, total_purchased)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // total_purchased starts same as stock_current for initial entry
    const values = [
      name,
      category,
      unit_type,
      lot_number || null,
      roll_number || null,
      purchase_date || null,
      cost_per_unit,
      stock_current || 0,
      stock_min_warning || 0,
      stock_current || 0
    ];

    const [result]: any = await pool.query(sql, values);

    return NextResponse.json({
      success: true,
      consumableId: result.insertId
    });

  } catch (error) {
    console.error("Erro ao criar consumível:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
