import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PUT(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const { status } = await req.json();

    const [rows] = await pool.query("SELECT id FROM quotes WHERE public_token = ?", [token]);
    const quote = (rows as any[])[0];

    if (!quote) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });

    await pool.query("UPDATE quotes SET status = ? WHERE id = ?", [status, quote.id]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
