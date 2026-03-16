import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM clients ORDER BY name");
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, company, email, phone, notes, discount_margin_pct, password } = body;

    // Check for Affiliate Cookie
    const cookieStore = await cookies();
    const affRef = cookieStore.get("aff_ref")?.value;
    const referredBy = affRef ? parseInt(affRef, 10) : null;

    let password_hash = null;
    if (password) {
      password_hash = await bcrypt.hash(password, 10);
    }

    const [result] = await pool.query(
      `INSERT INTO clients (name, company, email, phone, notes, password_hash, discount_margin_pct, referred_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, company || null, email || null, phone || null, notes || null, password_hash, discount_margin_pct || 0, referredBy]
    );
    const id = (result as any).insertId;
    const [rows] = await pool.query("SELECT * FROM clients WHERE id = ?", [id]);
    return NextResponse.json((rows as any[])[0], { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
