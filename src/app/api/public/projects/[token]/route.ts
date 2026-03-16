import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    // Get project details
    const [projectRows] = await pool.query(`
      SELECT p.*, c.name as client_name, c.company as client_company
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.public_token = ?
    `, [token]);

    const project = (projectRows as any[])[0];
    if (!project) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

    // Get quotes for this project
    const [quotes] = await pool.query(`
      SELECT q.id, q.title, q.quantity, q.final_price, q.final_price_per_unit, q.status, q.extras_total,
             f.name as filament_name, f.color as filament_color, f.type as filament_type
      FROM quotes q
      JOIN filaments f ON q.filament_id = f.id
      WHERE q.project_id = ?
    `, [project.id]);

    project.quotes = quotes;
    project.total_price = (quotes as any[]).reduce((sum, q) => sum + Number(q.final_price), 0);

    return NextResponse.json(project);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
