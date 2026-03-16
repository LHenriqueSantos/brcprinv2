import { NextResponse } from "next/server";
import pool from "@/lib/db";

// POST /api/quotes/[id]/accept-counter-offer
// Called by the ADMIN when they want to accept the client's counter-offer price.
// This resets status to 'quoted' with the new price so the CLIENT can then
// formally approve and proceed to payment/production.
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const [rows] = await pool.query(
      "SELECT id, status, counter_offer_price, quantity FROM quotes WHERE id = ?",
      [id]
    );
    const quote = (rows as any[])[0];
    if (!quote) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
    if (quote.status !== "counter_offer") {
      return NextResponse.json({ error: "Esta cotação não possui contraproposta ativa" }, { status: 409 });
    }
    if (!quote.counter_offer_price || Number(quote.counter_offer_price) <= 0) {
      return NextResponse.json({ error: "Preço da contraproposta inválido" }, { status: 400 });
    }

    const newPricePerUnit = Number(quote.counter_offer_price);
    const qty = Number(quote.quantity) || 1;
    const newFinalPrice = parseFloat((newPricePerUnit * qty).toFixed(2));

    // Apply counter-offer price and reset to 'quoted' so client can approve
    await pool.query(
      `UPDATE quotes SET
        final_price_per_unit = ?,
        final_price = ?,
        status = 'quoted',
        counter_offer_notes = CONCAT(COALESCE(counter_offer_notes, ''), ' [Aceito pelo Fabricante]')
       WHERE id = ?`,
      [newPricePerUnit, newFinalPrice, id]
    );

    return NextResponse.json({
      success: true,
      final_price_per_unit: newPricePerUnit,
      final_price: newFinalPrice
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
