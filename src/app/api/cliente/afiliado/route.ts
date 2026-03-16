import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createAffiliateProfile } from "@/lib/createAffiliate";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "cliente") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const email = session.user.email;
    if (!email) return NextResponse.json({ error: "E-mail não encontrado na sessão." }, { status: 400 });

    // Busca o afiliado pelo e-mail
    let [affRows] = await pool.query(
      `SELECT a.*,
        (SELECT COUNT(*) FROM clients c WHERE c.referred_by = a.id) as total_referrals,
        (SELECT SUM(commission_amount) FROM affiliate_commissions ac WHERE ac.affiliate_id = a.id AND ac.status IN ('pending')) as pending_earnings,
        (SELECT SUM(commission_amount) FROM affiliate_commissions ac WHERE ac.affiliate_id = a.id AND ac.status IN ('available')) as available_earnings,
        (SELECT SUM(commission_amount) FROM affiliate_commissions ac WHERE ac.affiliate_id = a.id AND ac.status IN ('paid')) as paid_earnings
       FROM affiliates a
       WHERE a.email = ?`,
      [email]
    );

    let affiliate = (affRows as any[])[0];

    // Criação on-the-fly para contas da base antiga
    if (!affiliate && session.user?.name) {
      await createAffiliateProfile(session.user.name, email);
      // Busca novamente após a criação
      [affRows] = await pool.query(
        `SELECT a.*,
          (SELECT COUNT(*) FROM clients c WHERE c.referred_by = a.id) as total_referrals,
          (SELECT SUM(commission_amount) FROM affiliate_commissions ac WHERE ac.affiliate_id = a.id AND ac.status IN ('pending')) as pending_earnings,
          (SELECT SUM(commission_amount) FROM affiliate_commissions ac WHERE ac.affiliate_id = a.id AND ac.status IN ('available')) as available_earnings,
          (SELECT SUM(commission_amount) FROM affiliate_commissions ac WHERE ac.affiliate_id = a.id AND ac.status IN ('paid')) as paid_earnings
         FROM affiliates a
         WHERE a.email = ?`,
        [email]
      );
      affiliate = (affRows as any[])[0];
    }

    if (!affiliate) {
      return NextResponse.json({
        not_found: true,
        message: "Perfil de afiliado não pôde ser gerado no momento. Tente novamente mais tarde."
      });
    }

    // Busca o histórico de comissões mais recentes
    const [historyRows] = await pool.query(
      `SELECT ac.id, ac.commission_amount, ac.status, ac.created_at, q.public_token
       FROM affiliate_commissions ac
       LEFT JOIN quotes q ON ac.quote_id = q.id
       WHERE ac.affiliate_id = ?
       ORDER BY ac.created_at DESC LIMIT 15`,
      [affiliate.id]
    );

    return NextResponse.json({
      ...affiliate,
      history: historyRows
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
