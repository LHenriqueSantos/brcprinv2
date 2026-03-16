import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { checkAdmin, forbiddenResponse } from "@/lib/adminCheck";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin()) return forbiddenResponse();
  try {
    const params = await props.params;
    const { id } = params;
    const body = await req.json();
    const { username, password, name, active } = body;

    let query = "UPDATE admins SET ";
    const values: any[] = [];
    const fields: string[] = [];

    if (username) {
      fields.push("username = ?");
      values.push(username);
    }
    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name);
    }
    if (active !== undefined) {
      fields.push("active = ?");
      values.push(active);
    }
    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      fields.push("password_hash = ?");
      values.push(password_hash);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
    }

    query += fields.join(", ") + " WHERE id = ?";
    values.push(id);

    await pool.query(query, values);

    return NextResponse.json({ message: "Administrador atualizado com sucesso" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin()) return forbiddenResponse();
  try {
    const params = await props.params;
    const { id } = params;
    await pool.query("DELETE FROM admins WHERE id = ?", [id]);
    return NextResponse.json({ message: "Administrador excluído com sucesso" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
