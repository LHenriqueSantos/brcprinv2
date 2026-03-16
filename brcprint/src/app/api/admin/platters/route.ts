import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { name, quoteIds } = await req.json();

    if (!name || !Array.isArray(quoteIds) || quoteIds.length === 0) {
      return NextResponse.json({ error: "Nome e Pelo menos uma cotação são obrigatórias" }, { status: 400 });
    }

    // Insert new platter
    const [result] = await pool.query(
      `INSERT INTO platters (name, status) VALUES (?, 'pending')`,
      [name]
    );
    const platterId = (result as any).insertId;

    // Update quotes with the new platter_id
    if (quoteIds.length > 0) {
      const placeholders = quoteIds.map(() => "?").join(",");
      await pool.query(
        `UPDATE quotes SET platter_id = ? WHERE id IN (${placeholders})`,
        [platterId, ...quoteIds]
      );
    }

    return NextResponse.json({ success: true, platterId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
