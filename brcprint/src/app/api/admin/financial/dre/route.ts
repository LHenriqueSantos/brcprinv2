import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkAdmin, forbiddenResponse } from "@/lib/adminCheck";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!await checkAdmin()) return forbiddenResponse();

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || new Date().toISOString().slice(5, 7);
    const year = searchParams.get("year") || new Date().getFullYear().toString();

    const periodStr = `${year}-${month}`;

    // 1. Receitas e Custos de Produção (Regime de Competência - Data da Cotação)
    // Usamos quotes que foram para produção ou entregues
    const [quoteRows]: any = await pool.query(`
      SELECT
        COALESCE(SUM(final_price), 0) as gross_revenue,
        COALESCE(SUM(tax_amount), 0) as total_taxes,
        COALESCE(SUM(cost_total_production), 0) as total_cogs
      FROM quotes
      WHERE status IN ('approved', 'in_production', 'delivered')
        AND DATE_FORMAT(created_at, '%Y-%m') = ?
    `, [periodStr]);

    const quoteData = quoteRows[0];

    // 2. Despesas Operacionais (Regime de Caixa - Data do Pagamento)
    const [expenseRows]: any = await pool.query(`
      SELECT
        type,
        category,
        COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE status = 'paid'
        AND DATE_FORMAT(payment_date, '%Y-%m') = ?
      GROUP BY type, category
    `, [periodStr]);

    // Categorizar despesas
    let fixedExpensesValue = 0;
    let variableExpensesValue = 0;
    const categoryDetails: any[] = [];

    expenseRows.forEach((row: any) => {
      if (row.type === 'fixed') {
        fixedExpensesValue += Number(row.total);
      } else {
        variableExpensesValue += Number(row.total);
      }
      categoryDetails.push({
        type: row.type,
        category: row.category,
        amount: Number(row.total)
      });
    });

    const netRevenue = Number(quoteData.gross_revenue) - Number(quoteData.total_taxes);
    const grossProfit = netRevenue - Number(quoteData.total_cogs);
    const ebitda = grossProfit - fixedExpensesValue - variableExpensesValue; // Simplified

    return NextResponse.json({
      period: periodStr,
      summary: {
        grossRevenue: Number(quoteData.gross_revenue),
        taxes: Number(quoteData.total_taxes),
        netRevenue,
        cogs: Number(quoteData.total_cogs),
        grossProfit,
        fixedExpenses: fixedExpensesValue,
        variableExpenses: variableExpensesValue,
        netProfit: ebitda
      },
      details: categoryDetails
    });

  } catch (error: any) {
    console.error("DRE API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
