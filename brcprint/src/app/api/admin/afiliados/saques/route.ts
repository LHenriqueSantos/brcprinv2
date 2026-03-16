import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkAdmin, forbiddenResponse } from "@/lib/adminCheck";

export async function GET() {
  if (!await checkAdmin()) return forbiddenResponse();
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.commission_amount, c.status, c.created_at,
              a.id as affiliate_id, a.name as affiliate_name, a.pix_key,
              q.public_token as quote_token
       FROM affiliate_commissions c
       JOIN affiliates a ON c.affiliate_id = a.id
       JOIN quotes q ON c.quote_id = q.id
       ORDER BY c.created_at DESC`
    );

    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
