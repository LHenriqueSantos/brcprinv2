import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows]: any = await pool.query("SELECT * FROM packaging_sizes WHERE active = 1 ORDER BY (length_cm * width_cm * height_cm) ASC");
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erro ao buscar embalagens:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, length_cm, width_cm, height_cm, cost, max_weight_kg, active } = body;

    if (!name || !length_cm || !width_cm || !height_cm) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    if (id) {
      // Update existing
      await pool.query(
        "UPDATE packaging_sizes SET name=?, length_cm=?, width_cm=?, height_cm=?, cost=?, max_weight_kg=?, active=? WHERE id=?",
        [name, length_cm, width_cm, height_cm, cost || 0, max_weight_kg || 30, active !== undefined ? active : 1, id]
      );
      return NextResponse.json({ success: true, updated: true });
    } else {
      // Insert new
      await pool.query(
        "INSERT INTO packaging_sizes (name, length_cm, width_cm, height_cm, cost, max_weight_kg, active) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [name, length_cm, width_cm, height_cm, cost || 0, max_weight_kg || 30, active !== undefined ? active : 1]
      );
      return NextResponse.json({ success: true, created: true });
    }
  } catch (err: any) {
    console.error("Erro ao salvar embalagem:", err);
    return NextResponse.json({ error: "Erro interno processando embalagem" }, { status: 500 });
  }
}
