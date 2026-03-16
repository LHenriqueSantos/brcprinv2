import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [rows]: any = await pool.query(`
      SELECT a.id, a.current_price, a.end_time, a.status, c.name as winner_name
      FROM auction_items a
      LEFT JOIN clients c ON a.winner_id = c.id
      WHERE a.status = 'active' OR a.status = 'pending'
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("API Realtime Error:", error);
    return NextResponse.json({ error: "Failed to fetch real-time data" }, { status: 500 });
  }
}
