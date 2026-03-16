import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkSellerOrAdmin, forbiddenResponse } from "@/lib/adminCheck";

export async function GET() {
  if (!await checkSellerOrAdmin()) return forbiddenResponse();
  try {
    const [rows] = await pool.query(
      `SELECT c.*, f.name as filament_name
       FROM catalog_items c
       LEFT JOIN filaments f ON c.filament_id = f.id
       ORDER BY c.created_at DESC`
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!await checkSellerOrAdmin()) return forbiddenResponse();
  try {
    const body = await req.json();
    const { title, description, category, image_url, stl_file_url, base_price, filament_id, active, is_digital_sale, digital_price } = body;

    if (!title || !stl_file_url || base_price === undefined) {
      return NextResponse.json({ error: "Título, Arquivo STL e Preço Base são obrigatórios" }, { status: 400 });
    }

    const [result] = await pool.query(
      `INSERT INTO catalog_items (title, description, category, image_url, stl_file_url, base_price, filament_id, active, is_digital_sale, digital_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, category, image_url, stl_file_url, base_price, filament_id || null, active ?? true, is_digital_sale || 0, digital_price || 0]
    );

    const id = (result as any).insertId;
    const [rows] = await pool.query("SELECT * FROM catalog_items WHERE id = ?", [id]);

    return NextResponse.json((rows as any[])[0], { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
