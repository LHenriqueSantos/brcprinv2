import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await req.json();

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }

    await pool.query("UPDATE reviews SET status = ? WHERE id = ?", [status, id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Admin Reviews PUT]", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
