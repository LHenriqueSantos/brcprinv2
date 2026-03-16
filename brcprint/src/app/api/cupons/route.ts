import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkSellerOrAdmin, forbiddenResponse } from "@/lib/adminCheck";

export const dynamic = 'force-dynamic';

// List all coupons
export async function GET() {
  if (!await checkSellerOrAdmin()) return forbiddenResponse();
  try {
    const [rows] = await pool.query("SELECT * FROM coupons ORDER BY id DESC");
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Create new coupon
export async function POST(req: Request) {
  if (!await checkSellerOrAdmin()) return forbiddenResponse();
  try {
    const body = await req.json();
    const { code, type, value, active, usage_limit, expires_at } = body;

    if (!code || !value) {
      return NextResponse.json({ error: "Code and value are required" }, { status: 400 });
    }

    const uppercaseCode = String(code).toUpperCase().trim();

    const [result] = await pool.query(
      `INSERT INTO coupons (code, type, value, active, usage_limit, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uppercaseCode,
        type || 'percentage',
        value,
        active !== undefined ? active : true,
        usage_limit || null,
        expires_at || null
      ]
    );

    return NextResponse.json({ id: (result as any).insertId, code: uppercaseCode });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: "Este código de cupom já existe." }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
