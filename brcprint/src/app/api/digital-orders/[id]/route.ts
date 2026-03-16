import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const [rows] = await pool.query(
      `SELECT id, status, download_token, catalog_item_id, price
       FROM digital_orders
       WHERE id = ?`,
      [id]
    ) as any[];

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    // Apenas aprovamos na PoC pra acelerar os testes.
    // Numa versão final isso vem via Webhook do MP/PagSeguro, com validação de payload.
    if (status !== "paid" && status !== "failed") {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }

    await pool.query(
      `UPDATE digital_orders SET status = ? WHERE id = ?`,
      [status, id]
    );

    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
