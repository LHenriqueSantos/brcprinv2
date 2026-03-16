import { NextResponse } from "next/server";
import Stripe from "stripe";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_build';
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-01-27.acacia" as any,
    });

    const { quoteId, publicToken, selectedShippingService, selectedShippingCost } = await req.json();

    // If shipping was selected in the frontend portal, update it in DB first to ensure consistent pricing
    if (selectedShippingService && selectedShippingCost !== undefined) {
      await pool.query(
        `UPDATE quotes q
         SET q.shipping_service = ?, q.shipping_cost = ?,
             q.final_price = (q.final_price - q.shipping_cost + ?)
         WHERE q.id = ? AND q.public_token = ?`,
        [selectedShippingService, selectedShippingCost, selectedShippingCost, quoteId, publicToken]
      );
    }

    // Verify quote
    const [rows] = await pool.query(
      "SELECT id, title, final_price, status, shipping_cost, shipping_service, discount_value, extras FROM quotes WHERE id = ? AND public_token = ?",
      [quoteId, publicToken]
    );
    const quote = (rows as any[])[0];

    if (!quote) {
      return NextResponse.json({ error: "Cotação não encontrada ou token inválido" }, { status: 404 });
    }

    if (quote.status !== "pending" && quote.status !== "approved" && quote.status !== "counter_offer") {
      return NextResponse.json({ error: "O status atual não permite pagamento." }, { status: 400 });
    }

    // The database final_price ALREADY includes shipping, discounts and extras.
    // To list shipping and extras separately in Stripe, we must deduct them from the product base price.
    let extrasTotal = 0;
    let extrasLineItems: any[] = [];

    if (quote.extras) {
      try {
        const parsedExtras = JSON.parse(quote.extras);
        if (Array.isArray(parsedExtras)) {
          parsedExtras.forEach((ex: any) => {
            const exPrice = Number(ex.price_applied || (ex.price * ex.quantity));
            extrasTotal += exPrice;
            extrasLineItems.push({
              price_data: {
                currency: "brl",
                product_data: {
                  name: `Extra: ${ex.name}`,
                },
                unit_amount: Math.round(exPrice * 100),
              },
              quantity: 1,
            });
          });
        }
      } catch (e) {
        console.error("Error parsing extras for Stripe:", e);
      }
    }

    const baseProductPrice = Number(quote.final_price) - Number(quote.shipping_cost || 0) - extrasTotal;
    const unitAmount = Math.max(0, Math.round(baseProductPrice * 100)); // Prevent negative base price
    const productName = quote.title || `Pedido de Impressão #${quote.id}`;

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: productName,
              description: `Produção sob demanda via BRCPrint${Number(quote.discount_value) > 0 ? ' (Cupom Aplicado)' : ''}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
        ...extrasLineItems,
        ...(Number(quote.shipping_cost) > 0 ? [{
          price_data: {
            currency: "brl",
            product_data: {
              name: `Frete - ${quote.shipping_service || 'Entrega'}`,
            },
            unit_amount: Math.round(Number(quote.shipping_cost) * 100),
          },
          quantity: 1,
        }] : []),
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/${publicToken}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/${publicToken}/cancel`,
      client_reference_id: String(quote.id),
      metadata: {
        quote_id: quote.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
