import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "Apenas admins" }, { status: 403 });
    }

    const clientId = params.id;
    const body = await req.json();
    const { subscription_plan_id, add_hours, add_grams, description } = body;

    // Se estivermos adicionando/removendo horas e/ou gramas
    if (add_hours !== undefined || add_grams !== undefined) {
      const hours = add_hours !== undefined ? parseFloat(add_hours) : 0;
      const grams = add_grams !== undefined ? parseFloat(add_grams) : 0;

      // Obter saldo atual do banco para uma adição segura (usaremos UPDATE com adição)
      await pool.query(
        "UPDATE clients SET available_hours_balance = available_hours_balance + ?, available_grams_balance = available_grams_balance + ? WHERE id = ?",
        [hours, grams, clientId]
      );

      // Registrar no log
      await pool.query(
        "INSERT INTO hour_transactions (client_id, type, hours_amount, grams_amount, description) VALUES (?, ?, ?, ?, ?)",
        [clientId, (hours >= 0 && grams >= 0) ? 'recharge' : 'adjustment', hours, grams, description || "Ajuste de Saldo"]
      );

      return NextResponse.json({ success: true, message: "Saldo atualizado." });
    }

    // Se estivermos vinculando a um plano
    if (subscription_plan_id !== undefined) {
      await pool.query(
        "UPDATE clients SET subscription_plan_id = ?, subscription_status = 'active' WHERE id = ?",
        [subscription_plan_id || null, clientId]
      );
      return NextResponse.json({ success: true, message: "Plano atualizado." });
    }

    return NextResponse.json({ error: "Nenhuma ação válida enviada." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "Apenas admins" }, { status: 403 });
    }

    const clientId = params.id;

    const [rows] = await pool.query(
      "SELECT t.*, q.title as quote_title FROM hour_transactions t LEFT JOIN quotes q ON t.quote_id = q.id WHERE t.client_id = ? ORDER BY t.created_at DESC",
      [clientId]
    );

    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
