import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkAdmin, forbiddenResponse } from "@/lib/adminCheck";

export async function GET() {
  if (!await checkAdmin()) return forbiddenResponse();
  try {
    const [rows] = await pool.query(
      `SELECT a.*,
        (SELECT COUNT(*) FROM clients c WHERE c.referred_by = a.id) as total_referrals,
        (SELECT SUM(commission_amount) FROM affiliate_commissions c WHERE c.affiliate_id = a.id AND c.status IN ('available', 'paid')) as total_earnings
       FROM affiliates a ORDER BY a.name ASC`
    );

    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!await checkAdmin()) return forbiddenResponse();
  try {
    const body = await req.json();
    const { name, email, referral_code, commission_rate_pct, pix_key, active } = body;

    const [result] = await pool.query(
      "INSERT INTO affiliates (name, email, referral_code, commission_rate_pct, pix_key, active) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, referral_code, commission_rate_pct || 0, pix_key || null, active !== false]
    );

    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: "E-mail ou Código de indicação já existe." }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
