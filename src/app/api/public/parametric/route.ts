import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, description, category, image_url, base_price, active
       FROM parametric_models
       WHERE active = 1
       ORDER BY created_at DESC`
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("[API Parametric Public ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
