import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { checkAdmin, forbiddenResponse } from "@/lib/adminCheck";

export async function GET() {
  if (!await checkAdmin()) return forbiddenResponse();
  try {
    const [rows] = await pool.query(
      "SELECT id, username, name, active, role, created_at FROM admins ORDER BY created_at DESC"
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!await checkAdmin()) return forbiddenResponse();
  try {
    const { username, password, name, role } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Usuário e senha são obrigatórios" }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO admins (username, password_hash, name, role) VALUES (?, ?, ?, ?)",
      [username, password_hash, name, role || "operador"]
    );

    return NextResponse.json({ message: "Administrador criado com sucesso" });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: "Este usuário já existe" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
