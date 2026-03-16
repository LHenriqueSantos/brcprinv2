import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";

// POST /api/quote-requests/manual/respond
// Admin sets a manual price for a manual quote request
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { quoteRequestId, price, notes } = body;

    if (!quoteRequestId || !price || isNaN(Number(price)) || Number(price) <= 0) {
      return NextResponse.json({ error: "ID da solicitação e preço são obrigatórios." }, { status: 400 });
    }

    // Fetch the original quote request
    const [qrRows]: any = await pool.query(
      `SELECT qr.*, c.name as client_name, c.email as client_email, c.phone as client_phone
       FROM quote_requests qr
       JOIN clients c ON qr.client_id = c.id
       WHERE qr.id = ?`,
      [quoteRequestId]
    );

    if (!qrRows.length) {
      return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });
    }

    const qr = qrRows[0];
    const finalPrice = Number(price);
    const publicToken = crypto.randomUUID();

    // Create the quote with all cost zeroed out (manual price is the final value)
    const [qResult] = await pool.query(
      `INSERT INTO quotes (
        title, client_id, public_token, printer_id, filament_id,
        print_time_hours, filament_used_g, setup_time_hours, post_process_hours,
        quantity, infill_percentage,
        energy_kwh_price, labor_hourly_rate, profit_margin_pct, loss_pct, spare_parts_pct,
        printer_power_watts, printer_purchase_price, printer_lifespan_hours, printer_maintenance_pct,
        filament_cost_per_kg,
        cost_filament, cost_energy, cost_depreciation, cost_maintenance, cost_labor,
        cost_losses, cost_spare_parts, cost_total_production, profit_value,
        final_price, final_price_per_unit, valid_days, status,
        file_urls, notes, request_type,
        client_zipcode, client_address, client_address_number, client_address_comp,
        client_neighborhood, client_city, client_state, client_document, client_name
      ) VALUES (?,?,?,1,1, 0,0,0,0, 1,20, 0,0,0,0,0, 0,0,0,0, 0, 0,0,0,0,0, 0,0,0,0, ?,?,30,'quoted', '[]', ?, 'manual', ?,?,?,?,?,?,?,?,?)`,
      [
        qr.title || "Orçamento Personalizado",
        qr.client_id,
        publicToken,
        finalPrice,
        finalPrice, // same per-unit for manual
        notes ? `${qr.manual_description}\n\n📝 Admin: ${notes}` : qr.manual_description,
        qr.client_zipcode || null, qr.client_address || null, qr.client_address_number || null,
        qr.client_address_comp || null, qr.client_neighborhood || null, qr.client_city || null,
        qr.client_state || null, qr.client_document || null, qr.client_name || null
      ]
    );

    const quoteId = (qResult as any).insertId;

    // Update quote_request to linked status
    await pool.query(
      "UPDATE quote_requests SET status = 'quoted', quote_id = ? WHERE id = ?",
      [quoteId, quoteRequestId]
    );

    // Send WhatsApp notification to client
    try {
      const [cfgRows]: any = await pool.query("SELECT * FROM business_config WHERE id = 1");
      const cfg = cfgRows[0];
      if (cfg?.whatsapp_access_token && qr.client_phone) {
        const msg = `🎉 *Seu orçamento personalizado está pronto!*\n\nOlá ${qr.client_name || ""}! Analisamos sua solicitação e preparamos uma proposta para você.\n\n💰 Valor: R$ ${finalPrice.toFixed(2)}\n📦 Projeto: ${qr.title || "Orçamento"}\n\nAcesse o link abaixo para visualizar e aprovar:\n${cfg.app_url || 'https://brcprint.com.br'}/portal/${publicToken}`;
        await fetch(`https://api.z-api.io/instances/${cfg.whatsapp_instance_id}/token/${cfg.whatsapp_access_token}/send-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: qr.client_phone.replace(/\D/g, ''), message: msg })
        });
      }
    } catch (e) {
      console.error("WhatsApp notification failed:", e);
    }

    return NextResponse.json({ success: true, quote_id: quoteId, portal_token: publicToken });
  } catch (err: any) {
    console.error("Manual quote respond error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
