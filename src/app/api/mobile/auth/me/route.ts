import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { decode } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET || "brcprint-secret-123456";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido ou inválido." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];

    const decoded = await decode({ token, secret });

    if (!decoded || !decoded.sub) {
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 401 });
    }

    const userType = decoded.userType || (decoded.role === 'cliente' ? 'client' : 'admin');

    if (userType === 'admin') {
      const [rows] = await pool.query(
        "SELECT id, username, name, email, role FROM admins WHERE id = ? AND active = 1 LIMIT 1",
        [decoded.sub]
      );
      const admins = rows as any[];

      if (admins.length === 0) {
        return NextResponse.json({ error: "Administrador não encontrado." }, { status: 404 });
      }

      return NextResponse.json({
        user: { ...admins[0], userType: 'admin' }
      });

    } else {
      const [rows] = await pool.query(
        "SELECT id, name, company, email, phone, document FROM clients WHERE id = ? LIMIT 1",
        [decoded.sub]
      );
      const clients = rows as any[];

      if (clients.length === 0) {
        return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
      }

      return NextResponse.json({
        user: { ...clients[0], role: 'cliente', userType: 'client' }
      });
    }

  } catch (error: any) {
    console.error("Erro na validação do token mobile:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
