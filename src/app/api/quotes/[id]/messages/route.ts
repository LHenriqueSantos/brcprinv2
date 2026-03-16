import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    const session = await getServerSession(authOptions);
    const [rows] = await pool.query("SELECT public_token, client_id FROM quotes WHERE id = ?", [id]);
    const quote = (rows as any[])[0];
    if (!quote) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });

    let hasAccess = false;
    if (session?.user && (session.user as any).role === "admin") {
      hasAccess = true;
    } else if (session?.user && (session.user as any).role === "client") {
      if (quote.client_id === Number((session.user as any).id)) hasAccess = true;
    }
    if (token === quote.public_token) hasAccess = true;

    if (!hasAccess) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

    const [messages] = await pool.query(
      "SELECT * FROM quote_messages WHERE quote_id = ? ORDER BY created_at ASC",
      [id]
    );

    return NextResponse.json(messages);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { token, message } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const [rows] = await pool.query("SELECT public_token, client_id FROM quotes WHERE id = ?", [id]);
    const quote = (rows as any[])[0];
    if (!quote) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });

    let senderType = "";
    if (session?.user && (session.user as any).role === "admin") {
      senderType = "admin";
    } else if (session?.user && (session.user as any).role === "client") {
      if (quote.client_id === Number((session.user as any).id)) senderType = "client";
    }
    if (token === quote.public_token) senderType = "client";

    if (!senderType) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

    const [insertHeader] = await pool.query(
      "INSERT INTO quote_messages (quote_id, sender_type, message) VALUES (?, ?, ?)",
      [id, senderType, message.trim()]
    );

    const [msgs] = await pool.query("SELECT * FROM quote_messages WHERE id = ?", [(insertHeader as any).insertId]);

    return NextResponse.json({ success: true, message: (msgs as any[])[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
