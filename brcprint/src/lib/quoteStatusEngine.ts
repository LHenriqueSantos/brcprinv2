import pool from "@/lib/db";

import { sendWhatsAppMessage } from "@/lib/whatsapp";

/**
 * Shared business logic for transitioning a quote's status.
 * Handles: affiliate commissions, filament deduction/rollback, printer hours, and WhatsApp webhooks.
 * @param id Quote ID
 * @param status New target status
 * @param origin Context (e.g., 'mercadopago_webhook', 'admin_panel')
 * @param lotId Optional filament lot id
 * @param resultPhotoUrl Optional photo of the result (Proof of Work)
 */
export async function transitionQuoteStatus(id: number | string, status: string, origin: string = 'system', lotId: number | null = null, resultPhotoUrl: string | null = null, showInShowroom: boolean | null = null) {
  console.log(`[StatusEngine] Transitioning quote ${id} to ${status} (Origin: ${origin})`);

  // 1. Fetch current quote state
  const [qRows] = await pool.query(
    `SELECT q.*, c.name as client_name, c.phone as client_phone, c.referred_by
     FROM quotes q LEFT JOIN clients c ON q.client_id = c.id WHERE q.id = ?`,
    [id]
  );

  const quotes = qRows as any[];
  if (quotes.length === 0) {
    throw new Error("Cotação não encontrada");
  }

  const quote = quotes[0];
  const oldStatus = quote.status;

  // 2. Affiliate Commissions Workflow
  // Trigger ONLY if changing to 'in_production' from a previous pending state, and not already paid.
  if (status === "in_production" && quote.referred_by) {
    try {
      // Check if commission already exists
      const [exCommRows] = await pool.query(
        "SELECT id FROM affiliate_commissions WHERE quote_id = ?",
        [id]
      );
      if ((exCommRows as any[]).length === 0) {
        const [affRows] = await pool.query(
          "SELECT commission_rate_pct, active FROM affiliates WHERE id = ?",
          [quote.referred_by]
        );
        const affiliate = (affRows as any[])[0];

        if (affiliate && affiliate.active && quote.profit_value) {
          const commissionAmount = Number(quote.profit_value) * (Number(affiliate.commission_rate_pct) / 100);
          await pool.query(
            `INSERT INTO affiliate_commissions (affiliate_id, quote_id, commission_amount, status)
             VALUES (?, ?, ?, 'available')`,
            [quote.referred_by, id, commissionAmount]
          );
          console.log(`[StatusEngine] Affiliate commission created: R$ ${commissionAmount}`);
        }
      }
    } catch (err) {
      console.error("[StatusEngine] Error generating affiliate commission:", err);
    }
  }

  // 3. Filament Inventory & Printer Hours Logic
  try {
    if (status === "in_production" && !quote.filament_deducted && quote.filament_used_g && quote.filament_id) {
      // Deduct inventory
      // If we have a lotId (passed in now) OR if the quote already had a filament_lot_id (unlikely for first time)
      const targetLotId = lotId || quote.filament_lot_id;

      if (targetLotId) {
        await pool.query(
          "UPDATE filament_lots SET current_weight_g = current_weight_g - ? WHERE id = ?",
          [quote.filament_used_g, targetLotId]
        );
      }

      await pool.query("UPDATE filaments SET current_weight_g = current_weight_g - ? WHERE id = ?", [quote.filament_used_g, quote.filament_id]);
      await pool.query("UPDATE quotes SET filament_deducted = 1, filament_lot_id = ? WHERE id = ?", [targetLotId || null, id]);

      // --- BOM DEDUCTION ---
      const [bomRows] = await pool.query("SELECT consumable_id, quantity FROM quote_bom WHERE quote_id = ?", [id]);
      const bomItems = bomRows as any[];
      for (const item of bomItems) {
        await pool.query(
          "UPDATE consumables SET stock_current = stock_current - ? WHERE id = ?",
          [item.quantity, item.consumable_id]
        );
      }
      console.log(`[StatusEngine] BOM items deducted for quote ${id}`);
    }
    else if ((status === "cancelled" || status === "rejected" || status === "approved") && quote.filament_deducted && quote.filament_used_g && quote.filament_id) {
      // Rollback inventory
      if (quote.filament_lot_id) {
        await pool.query(
          "UPDATE filament_lots SET current_weight_g = current_weight_g + ? WHERE id = ?",
          [quote.filament_used_g, quote.filament_lot_id]
        );
      }

      await pool.query(
        "UPDATE filaments SET current_weight_g = current_weight_g + ? WHERE id = ?",
        [quote.filament_used_g, quote.filament_id]
      );
      await pool.query("UPDATE quotes SET filament_deducted = 0 WHERE id = ?", [id]);

      // --- BOM ROLLBACK ---
      const [bomRows] = await pool.query("SELECT consumable_id, quantity FROM quote_bom WHERE quote_id = ?", [id]);
      const bomItems = bomRows as any[];
      for (const item of bomItems) {
        await pool.query(
          "UPDATE consumables SET stock_current = stock_current + ? WHERE id = ?",
          [item.quantity, item.consumable_id]
        );
      }
      console.log(`[StatusEngine] BOM items rolled back for quote ${id}`);
    }

    if (status === "delivered" && quote.print_time_hours && quote.printer_id) {
      // Only increment printer hours exactly once on final delivery (could alternatively do it during production)
      // Keeping it simple for the engine
      await pool.query(
        "UPDATE printers SET current_hours_printed = current_hours_printed + ? WHERE id = ?",
        [quote.print_time_hours, quote.printer_id]
      );
    }
  } catch (err) {
    console.error("[StatusEngine] Error modifying inventory/printers:", err);
  }

  // 3.5 Cashback Accrual & Payment Logic — triggers when payment is confirmed (automated or manual)
  try {
    const isConfirmingPayment = (status === "approved" || status === "in_production") && oldStatus === "awaiting_payment";

    if (isConfirmingPayment && quote.client_id) {
      // Mark as paid in DB if not already (safeguard)
      if (!quote.is_paid) {
        await pool.query("UPDATE quotes SET is_paid = 1, paid_at = NOW() WHERE id = ?", [id]);
        quote.is_paid = 1;
      }

      // DEDUCT credits used (if any)
      if (Number(quote.credits_used) > 0) {
        await pool.query(
          "UPDATE clients SET credit_balance = credit_balance - ? WHERE id = ?",
          [quote.credits_used, quote.client_id]
        );
        console.log(`[StatusEngine] Deducted R$ ${quote.credits_used} from client ${quote.client_id} (Cashback usage)`);
      }

      // ACCRUE new cashback reward
      const [cRows] = await pool.query("SELECT enable_cashback, cashback_pct FROM business_config WHERE id = 1");
      const config = (cRows as any[])[0];

      if (config && config.enable_cashback && quote.final_price) {
        const ganho = Number(quote.final_price) * (Number(config.cashback_pct) / 100);
        if (ganho > 0) {
          await pool.query(
            "UPDATE clients SET credit_balance = credit_balance + ?, total_cashback_earned = total_cashback_earned + ? WHERE id = ?",
            [ganho, ganho, quote.client_id]
          );
          console.log(`[StatusEngine] Cashback of R$ ${ganho.toFixed(2)} granted to client ${quote.client_id}`);
          // Attach for WhatsApp notification
          quote.cashback_earned = ganho;
        }
      }
    }
  } catch (err) {
    console.error("[StatusEngine] Error processing cashback & payment:", err);
  }

  // 4. Update the actual Quote Status, Photo and Showroom flag
  if (resultPhotoUrl && showInShowroom !== null) {
    await pool.query("UPDATE quotes SET status = ?, result_photo_url = ?, show_in_showroom = ? WHERE id = ?", [status, resultPhotoUrl, showInShowroom ? 1 : 0, id]);
  } else if (resultPhotoUrl) {
    await pool.query("UPDATE quotes SET status = ?, result_photo_url = ? WHERE id = ?", [status, resultPhotoUrl, id]);
  } else if (showInShowroom !== null) {
    await pool.query("UPDATE quotes SET status = ?, show_in_showroom = ? WHERE id = ?", [status, showInShowroom ? 1 : 0, id]);
  } else {
    await pool.query("UPDATE quotes SET status = ? WHERE id = ?", [status, id]);
  }

  // 4.5. Zero-Click Printing (Phase 58)
  // If moving to production and we have a G-Code ready, auto-dispatch to a printer!
  if (status === "in_production" && quote.gcode_url) {
    try {
      let targetPrinterId = quote.printer_id;
      let pApiType = null;
      let pIpAddress = null;
      let pApiKey = null;
      let pName = "Auto-Assigned";

      if (!targetPrinterId) {
        // Auto-Route Printer
        console.log(`[StatusEngine] Quote ${id} missing printer. Searching for idle IoT printer...`);
        const [pRows] = await pool.query(`
          SELECT p.id, p.api_type, p.ip_address, p.api_key, p.name,
                 (SELECT COUNT(*) FROM quotes WHERE printer_id = p.id AND status = 'in_production') as active_jobs
          FROM printers p
          WHERE p.active = 1 AND p.api_type IN ('moonraker', 'octoprint')
          ORDER BY active_jobs ASC
          LIMIT 1
        `);
        const availablePrinter = (pRows as any[])[0];

        if (availablePrinter) {
          targetPrinterId = availablePrinter.id;
          pApiType = availablePrinter.api_type;
          pIpAddress = availablePrinter.ip_address;
          pApiKey = availablePrinter.api_key;
          pName = availablePrinter.name;
          await pool.query("UPDATE quotes SET printer_id = ? WHERE id = ?", [targetPrinterId, id]);
          console.log(`[StatusEngine] Auto-Routed Quote ${id} to Printer ${pName} (${targetPrinterId})`);
        } else {
          console.log(`[StatusEngine] No idle IoT printer found for zero-click dispatch.`);
        }
      } else {
        // Fetch existing printer details
        const [pRows] = await pool.query("SELECT api_type, ip_address, api_key, name FROM printers WHERE id = ?", [targetPrinterId]);
        const existingPrinter = (pRows as any[])[0];
        if (existingPrinter) {
          pApiType = existingPrinter.api_type;
          pIpAddress = existingPrinter.ip_address;
          pApiKey = existingPrinter.api_key;
          pName = existingPrinter.name;
        }
      }

      // Dispatch G-Code
      if (targetPrinterId && pIpAddress && pApiType !== 'none') {
        const fs = require('fs/promises');
        const path = require('path');
        const filename = path.basename(quote.gcode_url);
        // Replace leading slash if exists to join properly
        const relativePath = quote.gcode_url.replace(/^\//, '');
        const filepath = path.join(process.cwd(), 'public', relativePath);

        try {
          const buffer = await fs.readFile(filepath);
          console.log(`[StatusEngine] Loaded G-Code ${filename}. Dispatching to ${pName} (${pIpAddress}) via ${pApiType}...`);
          const baseUrl = pIpAddress.startsWith('http') ? pIpAddress : `http://${pIpAddress}`;

          if (pApiType === 'octoprint') {
            const octoFormData = new FormData();
            const localBlob = new Blob([buffer], { type: 'application/octet-stream' });
            octoFormData.append("file", localBlob, filename);
            octoFormData.append("select", "true");
            octoFormData.append("print", "true"); // Direct Print Trigger

            const res = await fetch(`${baseUrl}/api/files/local`, {
              method: 'POST',
              headers: { 'X-Api-Key': pApiKey || '' },
              body: octoFormData,
            });
            if (res.ok) console.log(`[StatusEngine] OctoPrint dispatch successful for Quote ${id}!`);
            else console.error(`[StatusEngine] OctoPrint dispatch failed: ${await res.text()}`);

          } else if (pApiType === 'moonraker') {
            const moonFormData = new FormData();
            const localBlob = new Blob([buffer], { type: 'application/octet-stream' });
            moonFormData.append("file", localBlob, filename);
            moonFormData.append("print", "true"); // Moonraker accepts print=true directly in recent versions

            const uploadRes = await fetch(`${baseUrl}/server/files/upload`, {
              method: 'POST',
              body: moonFormData,
            });

            if (uploadRes.ok) console.log(`[StatusEngine] Moonraker dispatch successful for Quote ${id}!`);
            else console.error(`[StatusEngine] Moonraker dispatch failed: ${await uploadRes.text()}`);
          }
        } catch (fileErr) {
          console.error(`[StatusEngine] Could not read or send G-Code file ${filepath} for dispatch.`, fileErr);
        }
      }
    } catch (iotErr) {
      console.error("[StatusEngine] Zero-click Dispatch Error:", iotErr);
    }
  }

  // 5. Fire-and-forget WhatsApp notification
  if (status === "in_production" || status === "delivered" || (status === "approved" && oldStatus === "awaiting_payment")) {
    (async () => {
      try {
        if (quote.client_phone) {
          let msg = "";
          if (status === "in_production") {
            if (quote.platter_id) {
              msg = `Olá ${quote.client_name}! Seu pedido #${id} acaba de entrar em PRODUÇÃO junto com a mesa colaborativa! 🚀`;
            } else {
              msg = `Olá ${quote.client_name}! Seu pedido #${id} acaba de entrar em PRODUÇÃO! 🚀`;
            }
          } else if (status === "approved" && oldStatus === "awaiting_payment") {
            msg = `Olá ${quote.client_name}! Pagamento do pedido #${id} confirmado! ✅ Em breve sua peça entra em produção.`;
            if (quote.cashback_earned) {
              msg += `\n\n🪙 Você ganhou *R$ ${quote.cashback_earned.toFixed(2).replace('.', ',')}* de Cashback para usar na próxima cotação!`;
            }
          } else {
            msg = `Olá ${quote.client_name}! Seu pedido #${id} está PRONTO e foi finalizado/entregue! 🎉`;
            if (quote.cashback_earned) {
              msg += `\n\n🎁 Você acaba de ganhar *R$ ${quote.cashback_earned.toFixed(2).replace('.', ',')}* de Cashback para usar na sua próxima impressão conosco!`;
            }
            if (resultPhotoUrl || quote.result_photo_url) {
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
              const token = quote.public_token;
              msg += `\n\n📸 *Proof of Work*: Veja como sua peça (ou o lote da mesa) ficou: ${baseUrl}/portal/${token}`;
            }
          }
          await sendWhatsAppMessage(quote.client_phone, msg);
        }
      } catch (e) {
        console.error("[StatusEngine] Webhook/WhatsApp notification failed:", e);
      }
    })();
  }

  // 6. External Webhook Trigger (Phase 60)
  if (status === "in_production") {
    (async () => {
      try {
        const [cRows] = await pool.query("SELECT webhook_url FROM business_config WHERE id = 1");
        const config = (cRows as any[])[0];

        if (config && config.webhook_url) {
          console.log(`[StatusEngine] Triggering external webhook to ${config.webhook_url} for Quote ${id}`);

          const payload = {
            event: "quote.paid",
            timestamp: new Date().toISOString(),
            data: {
              id: quote.id,
              title: quote.title,
              client: {
                name: quote.client_name,
                phone: quote.client_phone,
              },
              total: quote.final_price,
              weight_g: quote.filament_used_g,
              time_hours: quote.print_time_hours,
              status: status,
              items: quote.items ? (typeof quote.items === 'string' ? JSON.parse(quote.items) : quote.items) : []
            }
          };

          await fetch(config.webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          console.log(`[StatusEngine] External webhook successfully triggered.`);
        }
      } catch (err) {
        console.error("[StatusEngine] Failed to trigger external webhook:", err);
      }
    })();
  }

  return true;
}
