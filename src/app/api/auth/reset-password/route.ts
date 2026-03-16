import pool from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token e nova senha são obrigatórios" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 });
    }

    // 1. Procurar o token no banco
    const [rows]: any = await pool.query(
      "SELECT id, email, user_type, expires_at, used FROM password_resets WHERE token = ?",
      [token]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Token inválido ou inexistente." }, { status: 400 });
    }

    const resetRequest = rows[0];

    // 2. Checar expiração e se já foi usado
    if (resetRequest.used === 1) {
      return NextResponse.json({ error: "Este link de recuperação já foi utilizado." }, { status: 400 });
    }

    if (new Date() > new Date(resetRequest.expires_at)) {
      return NextResponse.json({ error: "Este link de recuperação expirou. Por favor, solicite um novo." }, { status: 400 });
    }

    // 3. Fazer o Hash da Nova Senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Atualizar a Tabela Apropriada (Cliente ou Admin)
    if (resetRequest.user_type === "client") {
      await pool.query(
        "UPDATE clients SET password_hash = ? WHERE email = ?",
        [hashedPassword, resetRequest.email]
      );
    } else if (resetRequest.user_type === "admin") {
      // Admins utilizam username como email na estrutura atual
      await pool.query(
        "UPDATE admins SET password_hash = ? WHERE username = ? AND active = 1",
        [hashedPassword, resetRequest.email]
      );
    }

    // 5. Invalidar o Token
    await pool.query(
      "UPDATE password_resets SET used = 1 WHERE id = ?",
      [resetRequest.id]
    );

    return NextResponse.json({ message: "Senha redefinida com sucesso." });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
