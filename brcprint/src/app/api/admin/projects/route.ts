import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const [rows] = await pool.query(`
      SELECT p.*, c.name as client_name, c.company as client_company,
             COUNT(q.id) as items_count,
             COALESCE(SUM(q.final_price), 0) as total_price
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN quotes q ON q.project_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await req.json();
    const { title, client_id, quote_ids } = body;

    if (!title || !Array.isArray(quote_ids) || quote_ids.length === 0) {
      return NextResponse.json({ error: "Título e pelo menos uma cotação são obrigatórios." }, { status: 400 });
    }

    // Insert project
    const [result] = await pool.query(
      `INSERT INTO projects (title, client_id, public_token) VALUES (?, ?, UUID())`,
      [title, client_id || null]
    );

    const projectId = (result as any).insertId;

    // Update quotes
    const placeholders = quote_ids.map(() => '?').join(',');
    await pool.query(
      `UPDATE quotes SET project_id = ? WHERE id IN (${placeholders})`,
      [projectId, ...quote_ids]
    );

    return NextResponse.json({ success: true, id: projectId }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
