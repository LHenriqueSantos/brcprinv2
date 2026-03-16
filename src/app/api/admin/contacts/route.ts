import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "vendedor", "operador"].includes((session.user as any)?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = `SELECT * FROM contacts`;
    let params: any[] = [];

    if (status && status !== "todas") {
      query += ` WHERE status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY created_at DESC`;

    const [rows]: any = await pool.query(query, params);
    return NextResponse.json({ contacts: rows });
  } catch (err: any) {
    console.error("ERRO /api/admin/contacts GET:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "vendedor", "operador"].includes((session.user as any)?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    await pool.query(
      `UPDATE contacts SET status = ? WHERE id = ?`,
      [status, id]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("ERRO /api/admin/contacts PUT:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
