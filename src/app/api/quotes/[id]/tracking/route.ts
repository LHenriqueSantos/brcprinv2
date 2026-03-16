import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { tracking_code } = body;

    // Check if quote exists
    const [rows]: any = await pool.query("SELECT id FROM quotes WHERE id = ?", [id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
    }

    await pool.query(
      `UPDATE quotes SET shipping_tracking_code = ? WHERE id = ?`,
      [tracking_code || null, id]
    );

    return NextResponse.json({ success: true, tracking_code });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
