import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, E-mail e Senha são obrigatórios." }, { status: 400 });
    }

    // Verifica se já existe um cliente com este e-mail
    const [existing] = await pool.query("SELECT id FROM clients WHERE email = ?", [email]);
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: "Este e-mail já está em uso." }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO clients (name, email, phone, password_hash) VALUES (?, ?, ?, ?)",
      [name, email, phone, password_hash]
    );

    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
