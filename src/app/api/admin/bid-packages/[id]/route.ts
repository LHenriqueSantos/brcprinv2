import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { checkSellerOrAdmin, forbiddenResponse } from "@/lib/adminCheck";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkSellerOrAdmin()) return forbiddenResponse();
  try {
    const { id } = await params;
    await query("DELETE FROM bid_packages WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
