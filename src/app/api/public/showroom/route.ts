import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT q.id, q.title, q.result_photo_url, q.created_at,
             f.name AS filament_name, f.color AS filament_color
      FROM quotes q
      LEFT JOIN filaments f ON q.filament_id = f.id
      WHERE q.show_in_showroom = 1 AND q.status = 'delivered' AND q.result_photo_url IS NOT NULL
      ORDER BY q.created_at DESC
    `);

    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
