import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { transitionQuoteStatus } from "@/lib/quoteStatusEngine";

// O SDK agora será instanciado dentro do request (melhor prática para Next.js)

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("topic") || url.searchParams.get("type");
    const dataId = url.searchParams.get("data.id") || url.searchParams.get("id");

    // MP envia { action: 'payment.created', data: { id: '123' } } no body também
    let bodyId = null;
    let bodyAction = null;
    try {
      const body = await request.clone().json();
      bodyId = body?.data?.id;
      bodyAction = body?.action || body?.type;
    } catch (e) { }

    const paymentIdToFetch = dataId || bodyId;
    const actionToWatch = action || bodyAction;

    if (!paymentIdToFetch) {
      return NextResponse.json({ message: "Ignorado - Sem ID payload" }, { status: 200 });
    }

    if (actionToWatch !== "payment" && actionToWatch !== "payment.created" && actionToWatch !== "payment.updated") {
      return NextResponse.json({ message: "Ignorado - Tópico não suportado" }, { status: 200 });
    }

    console.log(`[Webhook MP] Received notification for Payment ID: ${paymentIdToFetch}`);

    // Instancia o SDK (pode vir do DB no futuro, por enquanto .env)
    const sdkToken = process.env.MP_ACCESS_TOKEN || 'TEST-0000';
    const client = new MercadoPagoConfig({ accessToken: sdkToken, options: { timeout: 5000 } });

    // Call MercadoPago to get the REAL status of this payment (Prevents spoofing)
    const paymentClient = new Payment(client);
    let paymentData;

    // Check if it's our Dev mock ID or a real ID
    if (sdkToken.startsWith('TEST-') && String(paymentIdToFetch).length > 3) {
      console.log(`[Webhook MP MOCK] Faking approved status for Payment ID: ${paymentIdToFetch}`);
      paymentData = { status: 'approved' };
    } else {
      paymentData = await paymentClient.get({ id: paymentIdToFetch });
    }

    if (paymentData.status === "approved") {
      // Find the quote
      const [rows] = await pool.query(
        "SELECT id, status FROM quotes WHERE mp_payment_id = ?",
        [paymentIdToFetch]
      );
      const quotes = rows as any[];

      if (quotes.length > 0) {
        const quote = quotes[0];

        // Only trigger engine if not already in production (idempotency)
        if (quote.status !== "in_production" && quote.status !== "delivered") {
          console.log(`[Webhook MP] Payment ${paymentIdToFetch} is APPROVED. Advancing Quote #${quote.id} to in_production.`);
          await transitionQuoteStatus(quote.id, "in_production", "mercadopago_webhook");
        } else {
          console.log(`[Webhook MP] Quote #${quote.id} is already in production/delivered. Skipping.`);
        }
      } else {
        console.error(`[Webhook MP] Quote not found for Payment ID: ${paymentIdToFetch}`);
      }
    } else {
      console.log(`[Webhook MP] Payment ${paymentIdToFetch} is currently ${paymentData.status}. Taking no action.`);
    }

    // Always return 200 OK so MercadoPago stops retrying
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("[Webhook MP] Erro ao processar:", error);
    // Return 200 even on error so MP doesn't temporarily block our endpoint if we have an internal crash
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 200 });
  }
}
