import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { transitionQuoteStatus } from "@/lib/quoteStatusEngine";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { printer_id, scheduled_start, scheduled_end } = body;

    // Se estiver removendo do agendamento (Fila de Espera)
    if (scheduled_start === null) {
      await pool.query(
        "UPDATE quotes SET printer_id = NULL, scheduled_start = NULL, scheduled_end = NULL WHERE id = ?",
        [id]
      );
      // Reverte o status para aprovado usando o engine (faz rollback de filamento se necessário)
      await transitionQuoteStatus(id, "approved", "admin_panel");
      return NextResponse.json({ success: true, message: "Agendamento removido e retornado para Fila" });
    }

    // Caso contrário, atualiza com as novas datas
    await pool.query(
      "UPDATE quotes SET printer_id = ?, scheduled_start = ?, scheduled_end = ? WHERE id = ?",
      [
        printer_id || null,
        scheduled_start ? new Date(scheduled_start) : null,
        scheduled_end ? new Date(scheduled_end) : null,
        id
      ]
    );

    // Avança o status para Em Produção usando o engine (deduz filamento, webhooks, auto-dispatch, etc)
    await transitionQuoteStatus(id, "in_production", "admin_panel");

    return NextResponse.json({ success: true, message: "Agendamento salvo e movido para Produção" });

  } catch (error: any) {
    console.error("Scheduler Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
