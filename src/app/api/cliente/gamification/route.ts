import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    const clientId = session.user.id;
    let totalXp = 0;

    // 1XP por cada R$ 1.00 gasto bruto em orçamentos convertidos (quotes)
    const [orders]: any = await pool.query(
      `SELECT SUM(final_price) as xp_from_orders FROM quotes WHERE client_id = ? AND status IN ('approved', 'shipped', 'delivered', 'in_production')`,
      [clientId]
    );

    // 1XP por cada R$ 1.00 gasto bruto no carrinho direto
    const [cartOrders]: any = await pool.query(
      `SELECT SUM(total) as xp_from_cart FROM cart_orders WHERE client_id = ? AND status IN ('paid', 'processing', 'shipped', 'delivered')`,
      [clientId]
    );

    // 50XP por indicação bem-sucedida (Afiliados)
    const xpOrders = Math.floor(Number(orders[0]?.xp_from_orders || 0));
    const xpCart = Math.floor(Number(cartOrders[0]?.xp_from_cart || 0));

    const [clientRows]: any = await pool.query(`SELECT email FROM clients WHERE id = ?`, [clientId]);
    const clientEmail = clientRows[0]?.email;
    let xpRefs = 0;

    if (clientEmail) {
      const [affRows]: any = await pool.query(`SELECT id FROM affiliates WHERE email = ?`, [clientEmail]);
      if (affRows.length > 0) {
        const affId = affRows[0].id;
        const [refRows]: any = await pool.query(`SELECT COUNT(*) as refs FROM clients WHERE referred_by = ?`, [affId]);
        xpRefs = Math.floor((Number(refRows[0]?.refs || 0)) * 50);
      }
    }

    totalXp = xpOrders + xpCart + xpRefs;

    // Calcula a Patente (Tier) Baseado no totalXP
    const tiers = [
      { id: 'iniciante', name: "Iniciante", min: 0, max: 500, color: "#9ca3af" }, // Cinza
      { id: 'bronze', name: "Bronze", min: 501, max: 2000, color: "#b45309" }, // Bronze
      { id: 'prata', name: "Prata", min: 2001, max: 5000, color: "#94a3b8" }, // Prata/Cinza
      { id: 'ouro', name: "Ouro", min: 5001, max: 15000, color: "#eab308" }, // Amarelo Especial
      { id: 'diamante', name: "Diamante (Black)", min: 15001, max: 9999999, color: "#4f46e5" }, // Indigo Blue
    ];

    let currentTier: any = tiers[0];
    let nextTier: any = tiers[1];

    for (let i = 0; i < tiers.length; i++) {
      if (totalXp >= tiers[i].min && totalXp <= tiers[i].max) {
        currentTier = tiers[i];
        if (i + 1 < tiers.length) {
          nextTier = tiers[i + 1];
        } else {
          nextTier = null;
        }
        break;
      }
    }

    const xpToNext = nextTier ? nextTier.min - totalXp : 0;
    const progressPercent = nextTier ? Math.min(100, Math.round(((totalXp - currentTier.min) / (nextTier.min - currentTier.min)) * 100)) : 100;

    return NextResponse.json({
      total_xp: totalXp,
      tier: currentTier,
      next_tier: nextTier,
      xp_to_next: xpToNext,
      progress_percent: progressPercent,
      breakdown: {
        orders: xpOrders,
        cart: xpCart,
        referrals: xpRefs
      }
    });

  } catch (error: any) {
    console.error("Error calculating gamification API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
