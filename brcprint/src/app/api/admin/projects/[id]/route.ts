import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { id } = params;

    // Disconnect quotes from the project
    await pool.query("UPDATE quotes SET project_id = NULL WHERE project_id = ?", [id]);

    // Delete the project
    await pool.query("DELETE FROM projects WHERE id = ?", [id]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
