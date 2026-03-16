import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any) || !(session.user as any).id) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { id } = await params;

    const [rows]: any = await pool.query(
      "SELECT id, status FROM bid_purchases WHERE id = ? AND client_id = ?",
      [id, (session.user as any).id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Compra não encontrada." }, { status: 404 });
    }

    return NextResponse.json({ status: rows[0].status });
  } catch (error: any) {
    console.error("[Buy Bid Pkg Status] Erro:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
