import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkAdmin, forbiddenResponse } from "@/lib/adminCheck";

export async function GET() {
  if (!await checkAdmin()) return forbiddenResponse();
  try {
    const [rows]: any = await pool.query(
      `SELECT * FROM expenses ORDER BY due_date ASC, created_at DESC`
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("GET /api/admin/expenses error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!await checkAdmin()) return forbiddenResponse();
  try {
    const body = await req.json();
    const { description, amount, category, due_date, status, type, payment_date } = body;

    const [result]: any = await pool.query(
      `INSERT INTO expenses (description, amount, category, due_date, status, type, payment_date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        description,
        amount,
        category || 'Geral',
        due_date,
        status || 'pending',
        type || 'fixed',
        status === 'paid' ? (payment_date || due_date) : null
      ]
    );

    return NextResponse.json({ id: result.insertId, ...body }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/expenses error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
