import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { transitionQuoteStatus } from "@/lib/quoteStatusEngine";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await context.params;

    // Fetch current quote
    const [rows] = await pool.query(
      "SELECT id, status, is_paid FROM quotes WHERE id = ?",
      [id]
    );
    const quote = (rows as any[])[0];

    if (!quote) {
      return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
    }

    if (quote.is_paid) {
      return NextResponse.json({ message: "Cotação já está marcada como paga" });
    }

    // Mark as paid
    await pool.query(
      "UPDATE quotes SET is_paid = 1, paid_at = NOW() WHERE id = ?",
      [id]
    );

    // If it was awaiting_payment, advance to approved
    if (quote.status === 'awaiting_payment') {
      await transitionQuoteStatus(id, 'approved', 'admin_payment_marking');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro API mark as paid:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
