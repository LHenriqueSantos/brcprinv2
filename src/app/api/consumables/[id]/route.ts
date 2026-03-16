import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkAdmin, forbiddenResponse } from "@/lib/adminCheck";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin()) return forbiddenResponse();

  try {
    const { id } = await params;

    // Soft delete to preserve historical quotes referencing this consumable
    await pool.query("UPDATE consumables SET active = 0 WHERE id = ?", [id]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
