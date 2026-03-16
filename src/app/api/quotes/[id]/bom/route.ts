import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const [rows] = await pool.query(
      `SELECT b.*, c.name, c.unit_type, c.cost_per_unit
       FROM quote_bom b
       JOIN consumables c ON b.consumable_id = c.id
       WHERE b.quote_id = ?`,
      [(await params).id]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar BOM" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { items } = await req.json(); // Array of { consumable_id, quantity }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const { id } = await params;
      // 1. Delete existing BOM for this quote
      await connection.query("DELETE FROM quote_bom WHERE quote_id = ?", [id]);

      // 2. Insert new items
      if (items && items.length > 0) {
        const values = items.map((it: any) => [id, it.consumable_id, it.quantity]);
        await connection.query(
          "INSERT INTO quote_bom (quote_id, consumable_id, quantity) VALUES ?",
          [values]
        );
      }

      await connection.commit();
      return NextResponse.json({ success: true });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao salvar BOM" }, { status: 500 });
  }
}
