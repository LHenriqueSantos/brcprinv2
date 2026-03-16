import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { transitionQuoteStatus } from "@/lib/quoteStatusEngine";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Sessão inválida ou expirada." }, { status: 401 });
    }

    const clientId = (session.user as any).id;
    const { token } = await params;

    // 1. Fetch Quote & Check Status
    const [qRows] = await pool.query(
      `SELECT q.id, q.print_time_hours, q.filament_used_g, q.status, q.client_id,
              c.available_hours_balance, c.available_grams_balance, c.subscription_status
       FROM quotes q
       JOIN clients c ON q.client_id = c.id
       WHERE q.public_token = ? AND q.client_id = ?`,
      [token, clientId]
    );

    const quote = (qRows as any[])[0];
    if (!quote) return NextResponse.json({ error: "Pedido não encontrado ou não pertence a você." }, { status: 404 });
    if (quote.status !== 'quoted') return NextResponse.json({ error: "O pedido não está com status 'Orçado'." }, { status: 400 });
    if (quote.subscription_status !== 'active') return NextResponse.json({ error: "Você não possui uma assinatura B2B ativa." }, { status: 403 });

    // 2. Validate sufficient balances (Hours AND Grams)
    const requiredHours = Number(quote.print_time_hours || 0);
    const requiredGrams = Number(quote.filament_used_g || 0);

    if (Number(quote.available_hours_balance) < requiredHours || Number(quote.available_grams_balance) < requiredGrams) {
      return NextResponse.json({ error: "Saldo insuficiente de horas ou gramas na sua assinatura." }, { status: 400 });
    }

    // 3. Deduct balances and update client
    await pool.query(
      "UPDATE clients SET available_hours_balance = available_hours_balance - ?, available_grams_balance = available_grams_balance - ? WHERE id = ?",
      [requiredHours, requiredGrams, clientId]
    );

    // 4. Log the dual deduction
    await pool.query(
      "INSERT INTO hour_transactions (client_id, quote_id, type, hours_amount, grams_amount, description) VALUES (?, ?, ?, ?, ?, ?)",
      [clientId, quote.id, 'deduction', -requiredHours, -requiredGrams, `Pagamento do Pedido #${quote.id}`]
    );

    // 5. Approve the quote using the engine
    await transitionQuoteStatus(quote.id, "in_production", "b2b_hours");

    return NextResponse.json({ success: true, message: "Pagamento realizado via Banco de Horas e Banco de Gramas com sucesso!" });

  } catch (err: any) {
    console.error("[PAY-WITH-HOURS]", err);
    return NextResponse.json({ error: "Erro interno no servidor ao processar o saldo B2B." }, { status: 500 });
  }
}
