import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [rows] = await pool.query(
      `SELECT q.*, p.name AS printer_name, p.model AS printer_model,
              f.name AS filament_name, f.type AS filament_type, f.brand AS filament_brand, f.color AS filament_color,
              c.name AS client_name, c.company AS client_company,
              c.email AS client_email, c.phone AS client_phone,
              q.file_url, q.file_urls
       FROM quotes q
       JOIN printers p ON q.printer_id = p.id
       JOIN filaments f ON q.filament_id = f.id
       LEFT JOIN clients c ON q.client_id = c.id
       LEFT JOIN quote_requests qr ON qr.quote_id = q.id
       WHERE q.id = ?`,
      [id]
    );
    if (!(rows as any[]).length) {
      return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
    }
    const quote = (rows as any[])[0];
    // Parse extras JSON
    if (typeof quote.extras === "string") {
      try { quote.extras = JSON.parse(quote.extras); } catch { quote.extras = []; }
    }
    if (!quote.extras) quote.extras = [];

    // Anexar configurações globais de features
    const [cRows] = await pool.query("SELECT enable_3d_viewer, enable_timeline, enable_chat, enable_stripe FROM business_config WHERE id = 1");
    quote.config = (cRows as any[])[0] || {};

    return NextResponse.json(quote);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Remove dependent records safely (ignore missing tables)
    const tables = ["quote_bom", "quote_consumables", "quote_messages"];
    for (const table of tables) {
      try { await pool.query(`DELETE FROM ${table} WHERE quote_id = ?`, [id]); } catch { /* table may not exist */ }
    }
    await pool.query("DELETE FROM quotes WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
