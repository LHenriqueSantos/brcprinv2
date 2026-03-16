import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const clientId = (session.user as any).id;
    const [rows] = await pool.query(
      "SELECT id, name, company, email, phone, document, zipcode, address, address_number, address_comp, neighborhood, city, state, discount_margin_pct FROM clients WHERE id = ?",
      [clientId]
    );

    const client = (rows as any[])[0];
    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
