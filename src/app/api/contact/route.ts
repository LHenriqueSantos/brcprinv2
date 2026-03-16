import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, email, phone, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Nome, e-mail e mensagem são obrigatórios" },
        { status: 400 }
      );
    }

    const [result]: any = await pool.query(
      `INSERT INTO contacts (name, email, phone, subject, message, status)
       VALUES (?, ?, ?, ?, ?, 'nova')`,
      [name, email, phone || null, subject || null, message]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (err: any) {
    console.error("ERRO /api/contact:", err);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
