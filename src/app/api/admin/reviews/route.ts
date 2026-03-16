import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkSellerOrAdmin, forbiddenResponse } from "@/lib/adminCheck";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!await checkSellerOrAdmin()) return forbiddenResponse();
  try {
    const [rows]: any = await pool.query(`
      SELECT
        r.id, r.rating, r.comment, r.photo_url, r.status, r.created_at,
        q.id as quote_id, q.title as quote_title,
        c.name as client_name, c.company
      FROM reviews r
      JOIN quotes q ON r.quote_id = q.id
      JOIN clients c ON r.client_id = c.id
      ORDER BY r.created_at DESC
    `);

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("[Admin Reviews GET]", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
