import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { token, code } = body;

    if (!code) {
      return NextResponse.json({ error: "Código do cupom não informado" }, { status: 400 });
    }

    // Valida token e pega quote
    const [qRows] = await pool.query(
      "SELECT id, public_token, status, final_price, shipping_cost, discount_value, coupon_id FROM quotes WHERE id = ?",
      [id]
    );
    const quote = (qRows as any[])[0];
    
    if (!quote) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
    if (quote.public_token !== token) return NextResponse.json({ error: "Token inválido" }, { status: 403 });
    if (quote.status !== "quoted" && quote.status !== "pending") {
      return NextResponse.json({ error: "Cupom não pode ser aplicado no status atual" }, { status: 400 });
    }

    if (quote.coupon_id) {
      return NextResponse.json({ error: "Um cupom já foi aplicado nesta cotação." }, { status: 400 });
    }

    // Busca cupom
    const uppercaseCode = String(code).toUpperCase().trim();
    const [cRows] = await pool.query(
      "SELECT id, type, value, active, usage_limit, times_used, expires_at FROM coupons WHERE code = ?",
      [uppercaseCode]
    );
    const coupon = (cRows as any[])[0];

    if (!coupon) return NextResponse.json({ error: "Cupom inválido ou não encontrado." }, { status: 404 });
    if (!coupon.active) return NextResponse.json({ error: "Este cupom foi desativado." }, { status: 400 });
    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) return NextResponse.json({ error: "Limite de uso excedido para este cupom." }, { status: 400 });
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return NextResponse.json({ error: "Este cupom expirou." }, { status: 400 });

    // Calcula desconto sobre o subtotal de peças (sem frete)
    const currentShipping = Number(quote.shipping_cost || 0);
    const basePrice = Number(quote.final_price || 0) - currentShipping;
    
    let discountAmount = 0;
    if (coupon.type === 'percent') {
      discountAmount = (basePrice * Number(coupon.value)) / 100;
    } else {
      discountAmount = Number(coupon.value);
    }

    // Impede desconto maior que o valor da peça
    if (discountAmount > basePrice) {
      discountAmount = basePrice;
    }

    const newFinalPrice = Number(quote.final_price) - discountAmount;

    // Atualiza cotação
    await pool.query(
      "UPDATE quotes SET coupon_id = ?, discount_value = ?, final_price = ? WHERE id = ?",
      [coupon.id, discountAmount, newFinalPrice, id]
    );

    // Registra uso do cupom se aplicável (opicional incremental já que ele não finalizou a compra, 
    // mas a lógica simples pede para incrementar agora ou apenas quando o status mudar pra pago.
    // Vamos incrementar agora como "reservado")
    await pool.query("UPDATE coupons SET times_used = times_used + 1 WHERE id = ?", [coupon.id]);

    return NextResponse.json({
      success: true,
      discount_amount: discountAmount,
      new_final_price: newFinalPrice,
      coupon_id: coupon.id
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
