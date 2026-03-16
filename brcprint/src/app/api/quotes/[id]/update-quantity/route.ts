import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { token, quantity } = body;

    if (!token || !quantity || quantity < 1) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // Validate token and get current quote data
    const [rows] = await pool.query(
      "SELECT id, public_token, status, final_price_per_unit FROM quotes WHERE id = ?",
      [id]
    );
    const quote = (rows as any[])[0];
    if (!quote) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
    if (quote.public_token !== token) return NextResponse.json({ error: "Token inválido" }, { status: 403 });
    if (quote.status !== "pending" && quote.status !== "quoted") {
      return NextResponse.json({ error: "Cotação não pode ser alterada neste status" }, { status: 409 });
    }

    const newQty = Number(quantity);
    const pricePerUnit = Number(quote.final_price_per_unit);
    const newFinalPrice = parseFloat((pricePerUnit * newQty).toFixed(2));

    await pool.query(
      `UPDATE quotes SET quantity = ?, final_price = ?, status = 'quoted' WHERE id = ?`,
      [newQty, newFinalPrice, id]
    );

    return NextResponse.json({
      success: true,
      quantity: newQty,
      final_price: newFinalPrice,
      final_price_per_unit: pricePerUnit
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
