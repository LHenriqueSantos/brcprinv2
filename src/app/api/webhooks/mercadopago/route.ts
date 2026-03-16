import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { transitionQuoteStatus } from "@/lib/quoteStatusEngine";
import { dispatchPrint } from "@/lib/octoprint";

// O SDK agora será instanciado dentro do request (melhor prática para Next.js)

async function autoPrintCartOrder(cartId: string) {
  try {
    // Busca todos os itens do carrinho que são do catálogo e têm auto-print habilitado
    const [rows]: any = await pool.query(`
      SELECT ci.gcode_url, p.ip_address, p.api_key, p.api_type, p.device_serial
      FROM cart_order_items coi
      JOIN catalog_items ci ON coi.catalog_item_id = ci.id
      JOIN printers p ON ci.target_printer_id = p.id
      WHERE coi.cart_order_id = ?
        AND ci.auto_print_enabled = 1
        AND ci.gcode_url IS NOT NULL
        AND p.api_type != 'none'
    `, [cartId]);

    const items = rows as any[];
    if (items.length === 0) return;

    console.log(`[AUTOPRINT] Iniciando impressão zero-click para o Pedido ${cartId} (${items.length} peças)`);

    for (const item of items) {
      if (!item.ip_address || !item.api_key) {
        console.warn(`[AUTOPRINT] Impressora alvo não configurada corretamente para o G-code ${item.gcode_url}`);
        continue;
      }

      const fullPath = process.cwd() + '/public' + item.gcode_url;
      const status = await dispatchPrint(
        { api_type: item.api_type, ip_address: item.ip_address, api_key: item.api_key, device_serial: item.device_serial },
        fullPath
      );
      console.log(`[AUTOPRINT] Disparo via Webhook MercadoPago concluído: ${status.message}`);
    }
  } catch (e) {
    console.error(`[AUTOPRINT] Falha fatal na esteira automática:`, e);
  }
}

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
      let isProcessed = false;

      // 1. Try to find in quotes (Existing flow)
      const [quoteRows] = await pool.query(
        "SELECT id, status FROM quotes WHERE mp_payment_id = ?",
        [paymentIdToFetch]
      );
      const quotes = quoteRows as any[];

      if (quotes.length > 0) {
        const quote = quotes[0];
        if (quote.status !== "in_production" && quote.status !== "delivered") {
          console.log(`[Webhook MP] APPROVED for Quote #${quote.id}. Advancing to in_production.`);
          await transitionQuoteStatus(quote.id, "in_production", "mercadopago_webhook");
        }
        isProcessed = true;
      }

      // 2. Try to find in cart_orders (New flow)
      const [orderRows] = await pool.query(
        "SELECT id, status FROM cart_orders WHERE mp_payment_id = ?",
        [paymentIdToFetch]
      );
      const orders = orderRows as any[];

      if (orders.length > 0) {
        const order = orders[0];
        if (order.status === 'pending_payment') {
          console.log(`[Webhook MP] APPROVED for Order #${order.id}. Updating status to paid.`);
          await pool.query(
            "UPDATE cart_orders SET status = 'paid', mp_status = 'approved', updated_at = NOW() WHERE id = ?",
            [order.id]
          );
          autoPrintCartOrder(order.id);
        }
        isProcessed = true;
      }

      // 3. Match via External Ref (Fallback)
      if (!isProcessed) {
        // Process external ref for cart orders
        const externalRef = paymentData?.external_reference;
        if (externalRef && externalRef.startsWith("CART_")) {
          // It's a cart order. The format is typically CART_123
          const cartId = externalRef.replace("CART_", "");
          const [refOrders]: any = await pool.query("SELECT id, status FROM cart_orders WHERE id = ?", [cartId]);

          if (refOrders.length > 0 && refOrders[0].status === 'pending_payment') {
            console.log(`[Webhook MP] APPROVED via Ext Ref for Order #${cartId}.`);
            await pool.query(
              "UPDATE cart_orders SET status = 'paid', mp_status = 'approved', mp_payment_id = ?, updated_at = NOW() WHERE id = ?",
              [paymentIdToFetch, cartId]
            );
            autoPrintCartOrder(cartId);
            isProcessed = true;
          } else if (refOrders.length > 0) {
            console.log(`[Webhook MP] Order #${cartId} matched by Ext Ref but status is already ${refOrders[0].status}. Skipping update.`);
          } else {
            console.log(`[Webhook MP] Order Ext Ref CART_${cartId} not found in database.`);
          }
        }

        // 4. Try to find in bid_purchases (Penny Auction packages)
        if (!isProcessed && externalRef && externalRef.startsWith("BIDPKG_")) {
          const purchaseId = externalRef.replace("BIDPKG_", "");
          const [purchaseRows]: any = await pool.query("SELECT id, client_id, bids_amount, status FROM bid_purchases WHERE id = ?", [purchaseId]);

          if (purchaseRows.length > 0) {
            const purchase = purchaseRows[0];
            if (purchase.status === 'pending') {
              console.log(`[Webhook MP] APPROVED for Bid Package Purchase #${purchase.id}. Crediting ${purchase.bids_amount} bids to client ${purchase.client_id}.`);

              // Conceder os lances (Insert On Duplicate Key Update)
              await pool.query(
                `INSERT INTO client_bids_balance (client_id, balance)
                    VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE balance = balance + ?`,
                [purchase.client_id, purchase.bids_amount, purchase.bids_amount]
              );

              // Marcar compra como aprovada
              await pool.query(
                "UPDATE bid_purchases SET status = 'approved', mp_payment_id = ?, updated_at = NOW() WHERE id = ?",
                [paymentIdToFetch, purchase.id]
              );

              isProcessed = true;
            }
          }
        }

        // Fallback genérico para carrinho just in case they sent the raw ID
        if (!isProcessed && externalRef && !externalRef.startsWith("CART_") && !externalRef.startsWith("BIDPKG_")) {
          const [refOrders]: any = await pool.query("SELECT id, status FROM cart_orders WHERE id = ?", [externalRef]);
          if (refOrders.length > 0 && refOrders[0].status === 'pending_payment') {
            console.log(`[Webhook MP] APPROVED via Raw Ext Ref for Order #${externalRef}.`);
            await pool.query(
              "UPDATE cart_orders SET status = 'paid', mp_status = 'approved', mp_payment_id = ?, updated_at = NOW() WHERE id = ?",
              [paymentIdToFetch, externalRef]
            );
            autoPrintCartOrder(externalRef);
            isProcessed = true;
          }
        }
      }
    } else {
      console.log(`[Webhook MP] Payment ${paymentIdToFetch} is currently ${paymentData?.status || 'unknown'}.`);
    }

    // Always return 200 OK so MercadoPago stops retrying
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("[Webhook MP] Erro ao processar:", error);
    // Return 200 even on error so MP doesn't temporarily block our endpoint if we have an internal crash
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 200 });
  }
}
