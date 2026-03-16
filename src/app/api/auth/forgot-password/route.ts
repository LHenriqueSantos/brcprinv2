import pool from "@/lib/db";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "E-mail é obrigatório" }, { status: 400 });
    }

    let userType: "client" | "admin" | null = null;
    let userName = "";

    // 1. Procurar na tabela de clientes
    const [clientRows]: any = await pool.query(
      "SELECT id, name FROM clients WHERE email = ?",
      [email]
    );

    if (clientRows.length > 0) {
      userType = "client";
      userName = clientRows[0].name || email.split("@")[0];
    } else {
      // 2. Procurar na tabela de admins (username funciona como email)
      const [adminRows]: any = await pool.query(
        "SELECT id, name FROM admins WHERE username = ? AND active = 1",
        [email]
      );
      if (adminRows.length > 0) {
        userType = "admin";
        userName = adminRows[0].name || email.split("@")[0];
      }
    }

    // Mesmo se não encontrar, retornamos sucesso genérico para não expor quais e-mails existem.
    if (!userType) {
      return NextResponse.json({ message: "Se o e-mail existir, um link de recuperação foi enviado." });
    }

    // 3. Gerar Token Seguro e Expirável
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora de validade

    // 4. Salvar o Token no banco de dados
    await pool.query(
      "INSERT INTO password_resets (email, token, user_type, expires_at) VALUES (?, ?, ?, ?)",
      [email, token, userType, expiresAt]
    );

    // 5. Enviar o e-mail
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/redefinir-senha?token=${token}`;

    await sendPasswordResetEmail({
      to: email,
      userName,
      resetUrl,
      lang: "pt"
    });

    return NextResponse.json({ message: "Se o e-mail existir, um link de recuperação foi enviado." });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
