import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { createAffiliateProfile } from "@/lib/createAffiliate";

export async function POST(req: Request) {
  try {
    const { name, email, phone, password, ref } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, E-mail e Senha são obrigatórios." }, { status: 400 });
    }

    const [existing] = await pool.query("SELECT id FROM clients WHERE email = ?", [email]);
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: "Este e-mail já está em uso." }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    let referredBy = null;
    if (ref) {
      const [affs] = await pool.query("SELECT id FROM affiliates WHERE referral_code = ? AND active = 1", [ref]);
      if ((affs as any[]).length > 0) {
        referredBy = (affs as any[])[0].id;
      }
    }

    const [result] = await pool.query(
      "INSERT INTO clients (name, email, phone, password_hash, referred_by) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone, password_hash, referredBy]
    );

    await createAffiliateProfile(name, email);

    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
