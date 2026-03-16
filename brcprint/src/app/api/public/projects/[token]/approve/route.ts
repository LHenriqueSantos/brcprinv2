import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    const { token } = params;

    // Get project
    const [projectRows] = await pool.query("SELECT id, status FROM projects WHERE public_token = ?", [token]);
    const project = (projectRows as any[])[0];

    if (!project) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    if (project.status === 'approved') return NextResponse.json({ error: "Projeto já está aprovado" }, { status: 400 });

    // Mark project as approved
    await pool.query("UPDATE projects SET status = 'approved' WHERE id = ?", [project.id]);

    // Mark all associated quotes as approved to move them to the Kanban board
    await pool.query("UPDATE quotes SET status = 'approved' WHERE project_id = ? AND status = 'quoted'", [project.id]);

    return NextResponse.json({ success: true, message: "Projeto e cotações aprovados com sucesso." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
