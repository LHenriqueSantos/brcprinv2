import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { consumableId, quantity_added, cost_per_unit, lot_number, roll_number, purchase_date } = await req.json();

    if (!consumableId || !quantity_added || cost_per_unit === undefined) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    // 1. Fetch current stats
    const [currentRows]: any = await pool.query("SELECT stock_current, total_purchased FROM consumables WHERE id = ?", [consumableId]);
    if (currentRows.length === 0) {
      return NextResponse.json({ error: "Consumível não encontrado." }, { status: 404 });
    }

    const current = currentRows[0];
    const newStock = Number(current.stock_current) + Number(quantity_added);
    const newTotalPurchased = Number(current.total_purchased) + Number(quantity_added);

    // 2. Update stock, total_purchased, cost_per_unit, and traceability
    await pool.query(
      "UPDATE consumables SET stock_current = ?, total_purchased = ?, cost_per_unit = ?, lot_number = ?, roll_number = ?, purchase_date = ? WHERE id = ?",
      [newStock, newTotalPurchased, cost_per_unit, lot_number || null, roll_number || null, purchase_date || null, consumableId]
    );

    // 3. Fetch updated record
    const [updatedRows]: any = await pool.query("SELECT * FROM consumables WHERE id = ?", [consumableId]);

    return NextResponse.json({ success: true, consumable: updatedRows[0] });

  } catch (error) {
    console.error("Erro ao atualizar estoque de consumível:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
