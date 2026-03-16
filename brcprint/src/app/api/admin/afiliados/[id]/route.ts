import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;
    const body = await req.json();
    const { name, email, referral_code, commission_rate_pct, pix_key, active } = body;

    const isActive = active !== false && active !== 0 && active !== "0";

    await pool.query(
      "UPDATE affiliates SET name=?, email=?, referral_code=?, commission_rate_pct=?, pix_key=?, active=? WHERE id=?",
      [name, email, referral_code, commission_rate_pct || 0, pix_key || null, isActive, id]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: "E-mail ou Código de indicação já existe em outro parceiro." }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
