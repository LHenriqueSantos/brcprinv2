import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, description, category, image_url, stl_file_url, base_price, filament_id, active, is_digital_sale, digital_price } = body;

    await pool.query(
      `UPDATE catalog_items
       SET title=?, description=?, category=?, image_url=?, stl_file_url=?, base_price=?, filament_id=?, active=?, is_digital_sale=?, digital_price=?
       WHERE id=?`,
      [title, description, category, image_url, stl_file_url, base_price, filament_id || null, active ?? true, is_digital_sale || 0, digital_price || 0, id]
    );

    const [rows] = await pool.query("SELECT * FROM catalog_items WHERE id = ?", [id]);

    return NextResponse.json((rows as any[])[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await pool.query("UPDATE catalog_items SET active = 0 WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
