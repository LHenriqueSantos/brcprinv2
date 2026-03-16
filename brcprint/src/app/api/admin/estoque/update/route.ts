import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkOperatorOrAdmin, forbiddenResponse } from "@/lib/adminCheck";

export async function POST(req: Request) {
  if (!await checkOperatorOrAdmin()) return forbiddenResponse();
  try {
    const body = await req.json();
    const { filamentId, weight_g, cost_per_kg, lot_number, roll_number, purchase_date } = body;

    if (!filamentId || !weight_g || !cost_per_kg) {
      return NextResponse.json({ error: "Parâmetros insuficientes (filamentId, weight_g, cost_per_kg)" }, { status: 400 });
    }

    await pool.query(
      `UPDATE filaments
       SET current_weight_g = current_weight_g + ?,
           total_purchased_g = total_purchased_g + ?,
           cost_per_kg = ?,
           lot_number = ?,
           roll_number = ?,
           purchase_date = ?
       WHERE id = ?`,
      [Number(weight_g), Number(weight_g), Number(cost_per_kg), lot_number || null, roll_number || null, purchase_date || null, filamentId]
    );

    const [rows] = await pool.query("SELECT * FROM filaments WHERE id = ?", [filamentId]);

    return NextResponse.json({
      success: true,
      message: "Estoque atualizado com sucesso",
      filament: (rows as any[])[0]
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
