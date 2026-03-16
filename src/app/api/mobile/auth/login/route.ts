import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { compare } from "bcryptjs";
import { encode } from "next-auth/jwt";

// Substituir isto pelo secret usado no next-auth
const secret = process.env.NEXTAUTH_SECRET || "brcprint-secret-123456";

// CORS Headers for Flutter Web / external origins
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const { identifier, password, userType = 'client' } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: "Credenciais obrigatórias." }, { status: 400, headers: corsHeaders });
    }

    if (userType === 'admin') {
      // Fallback: Super Administrador (Variáveis de Ambiente)
      if (
        identifier === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
      ) {
        const tokenPayload = {
          name: "Super Administrador",
          email: "",
          sub: "0",
          role: "admin",
          userType: "admin",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        };
        const token = await encode({ token: tokenPayload, secret });
        return NextResponse.json({
          token,
          user: { id: "0", name: "Super Administrador", role: "admin", userType: 'admin' }
        }, { headers: corsHeaders });
      }

      // Login do Administrador do Banco de Dados
      const [rows] = await pool.query(
        "SELECT * FROM admins WHERE username = ? AND active = 1 LIMIT 1",
        [identifier]
      );
      const admins = rows as any[];

      if (admins.length === 0) {
        return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401, headers: corsHeaders });
      }

      const admin = admins[0];
      const passwordsMatch = await compare(password, admin.password_hash);

      if (!passwordsMatch) {
        return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401, headers: corsHeaders });
      }

      const tokenPayload = {
        name: admin.name || admin.username,
        email: admin.email || "",
        sub: admin.id.toString(),
        role: admin.role || "operador",
        userType: "admin",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      };

      const token = await encode({ token: tokenPayload, secret });

      return NextResponse.json({
        token,
        user: { id: admin.id, name: admin.name || admin.username, role: admin.role || "operador", userType: 'admin' }
      }, { headers: corsHeaders });

    } else {
      // Login do Cliente (Padrão)
      const [rows] = await pool.query(
        "SELECT * FROM clients WHERE email = ? LIMIT 1",
        [identifier]
      );
      const clients = rows as any[];

      if (clients.length === 0) {
        return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401, headers: corsHeaders });
      }

      const client = clients[0];

      if (!client.password_hash) {
        return NextResponse.json({ error: "Login social obrigatório ou conta não possui senha configurada." }, { status: 401, headers: corsHeaders });
      }

      const passwordsMatch = await compare(password, client.password_hash);

      if (!passwordsMatch) {
        return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401, headers: corsHeaders });
      }

      const tokenPayload = {
        name: client.name,
        email: client.email,
        sub: client.id.toString(),
        role: "cliente",
        userType: "client",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      };

      const token = await encode({ token: tokenPayload, secret });

      return NextResponse.json({
        token,
        user: { id: client.id, name: client.name, email: client.email, role: "cliente", userType: 'client' }
      }, { headers: corsHeaders });
    }

  } catch (error: any) {
    console.error("Erro no login mobile:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500, headers: corsHeaders });
  }
}
