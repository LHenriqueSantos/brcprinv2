import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkOperatorOrAdmin, forbiddenResponse } from "@/lib/adminCheck";

export async function GET() {
  if (!await checkOperatorOrAdmin()) return forbiddenResponse();
  try {
    // Buscar impressoras ativas
    const [printersRows] = await pool.query(
      "SELECT id, name, type, active FROM printers WHERE active = 1 ORDER BY name ASC"
    );

    // Buscar cotações (agendadas e não agendadas) que estão aprovadas ou em produção
    const [quotesRows] = await pool.query(`
      SELECT
        q.id, q.title, q.status, q.print_time_hours, q.scheduled_start, q.scheduled_end, q.printer_id,
        c.name as client_name
      FROM quotes q
      LEFT JOIN clients c ON q.client_id = c.id
      WHERE q.status IN ('quoted', 'approved', 'in_production')
      ORDER BY q.created_at DESC
    `);

    return NextResponse.json({
      printers: printersRows,
      quotes: quotesRows
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
