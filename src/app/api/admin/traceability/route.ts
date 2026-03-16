import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkSellerOrAdmin, forbiddenResponse } from "@/lib/adminCheck";

export async function GET(req: Request) {
  if (!await checkSellerOrAdmin()) return forbiddenResponse();

  try {
    const { searchParams } = new URL(req.url);
    const lotNumber = searchParams.get("lot");

    if (!lotNumber) {
      return NextResponse.json({ error: "Número de lote é obrigatório." }, { status: 400 });
    }

    // Search for the lot and all associated quotes
    const [rows] = await pool.query(`
      SELECT
        q.id as quote_id, q.title as quote_title, q.status, q.created_at as production_date,
        fl.lot_number, fl.created_at as lot_entry_date,
        f.name as filament_name, f.type as filament_type,
        c.name as client_name, c.company as client_company, c.email as client_email, c.phone as client_phone
      FROM quotes q
      JOIN filament_lots fl ON q.filament_lot_id = fl.id
      JOIN filaments f ON q.filament_id = f.id
      LEFT JOIN clients c ON q.client_id = c.id
      WHERE fl.lot_number LIKE ?
      ORDER BY q.created_at DESC
    `, [`%${lotNumber}%`]);

    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
