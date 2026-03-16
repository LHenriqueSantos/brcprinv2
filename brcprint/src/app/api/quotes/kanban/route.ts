import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Fetch optimized data for Kanban board (exclude huge margins, etc.)
    const [rows] = await pool.query(`
      SELECT q.id, q.title, q.status, q.print_time_hours, q.final_price, q.created_at, q.filament_id, q.is_multicolor,
             c.name AS client_name, c.company AS client_company,
             p.name AS printer_name,
             qr.file_url,
             q.platter_id, pt.name AS platter_name,
             (SELECT COUNT(*) FROM quote_messages WHERE quote_id = q.id) AS message_count
      FROM quotes q
      LEFT JOIN clients c ON q.client_id = c.id
      JOIN printers p ON q.printer_id = p.id
      LEFT JOIN quote_requests qr ON qr.quote_id = q.id
      LEFT JOIN platters pt ON q.platter_id = pt.id
      WHERE q.status IN ('quoted', 'approved', 'in_production', 'delivered')
      ORDER BY q.created_at DESC
    `);

    // Some basic mapping to ensure no null statuses
    const quotes = (rows as any[]).map(r => ({
      ...r,
      status: r.status || 'quoted'
    }));

    return NextResponse.json(quotes);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
