import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Código do cupom não informado" }, { status: 400 });
    }

    const uppercaseCode = String(code).toUpperCase().trim();

    const [rows] = await pool.query(
      "SELECT id, type, value, active, usage_limit, times_used, expires_at FROM coupons WHERE code = ?",
      [uppercaseCode]
    );

    const coupon = (rows as any[])[0];

    if (!coupon) {
      return NextResponse.json({ error: "Cupom inválido ou não encontrado." }, { status: 404 });
    }

    if (!coupon.active) {
      return NextResponse.json({ error: "Este cupom foi desativado." }, { status: 400 });
    }

    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
      return NextResponse.json({ error: "Limite de uso excedido para este cupom." }, { status: 400 });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: "Este cupom expirou." }, { status: 400 });
    }

    // Valid and good to go
    return NextResponse.json({
      valid: true,
      id: coupon.id,
      type: coupon.type,
      value: Number(coupon.value),
    });

  } catch (err: any) {
    return NextResponse.json({ error: "Erro ao validar cupom" }, { status: 500 });
  }
}
