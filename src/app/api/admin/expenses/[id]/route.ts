import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { description, amount, category, due_date, status, type, payment_date } = body;

    // Se mudou para pago e não tem data de pagamento, usa a data atual
    let finalPaymentDate = payment_date;
    if (status === 'paid' && !finalPaymentDate) {
      finalPaymentDate = new Date().toISOString().split('T')[0];
    }

    await pool.query(
      `UPDATE expenses SET description = ?, amount = ?, category = ?, due_date = ?, status = ?, type = ?, payment_date = ? WHERE id = ?`,
      [description, amount, category, due_date, status, type || 'fixed', finalPaymentDate, id]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`PUT /api/admin/expenses/${id} error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await pool.query(`DELETE FROM expenses WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`DELETE /api/admin/expenses/${id} error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
