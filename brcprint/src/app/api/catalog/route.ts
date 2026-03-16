import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, f.name as default_filament_name, f.color as default_filament_color
       FROM catalog_items c
       LEFT JOIN filaments f ON c.filament_id = f.id
       WHERE c.active = 1
       ORDER BY c.created_at DESC`
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
