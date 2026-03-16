import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "cliente") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const clientId = (session.user as any).id;

    const [rows]: any = await pool.query(`
      SELECT b.id, b.price_after_bid as amount, b.created_at, a.title, a.image_url, a.status as auction_status
      FROM bids b
      JOIN auction_items a ON b.auction_id = a.id
      WHERE b.client_id = ?
      ORDER BY b.created_at DESC
      LIMIT 100
    `, [clientId]);

    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
