import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendQuoteEmail } from "@/lib/mail";

import { calculateCosts } from "@/lib/pricing";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "50";
    const [rows] = await pool.query(
      `SELECT q.*, p.name AS printer_name, f.name AS filament_name, f.type AS filament_type, f.color AS filament_color,
              c.name AS client_name, c.company AS client_company
       FROM quotes q
       JOIN printers p ON q.printer_id = p.id
       JOIN filaments f ON q.filament_id = f.id
       LEFT JOIN clients c ON q.client_id = c.id
       ORDER BY q.created_at DESC
       LIMIT ?`,
      [parseInt(limit)]
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      client_id,
      printer_id,
      filament_id,
      print_time_hours,
      filament_used_g,
      setup_time_hours = 0.5,
      post_process_hours = 0,
      quantity = 1,
      notes,
      extras = [],
      valid_days = 30,
      send_email = false,
      // optional overrides — otherwise pull from DB
      profit_margin_pct: body_profit_margin_pct,
      loss_pct: body_loss_pct,
      spare_parts_pct: body_spare_parts_pct,
      request_id,
      file_urls = [],
      reference_images = [],
      bomItems = [], // New: Array of { consumable_id, quantity }
    } = body;

    // Fetch printer
    const [printerRows] = await pool.query("SELECT * FROM printers WHERE id = ?", [printer_id]);
    const printer = (printerRows as any[])[0];
    if (!printer) return NextResponse.json({ error: "Impressora não encontrada" }, { status: 404 });

    // Fetch filament
    const [filamentRows] = await pool.query("SELECT * FROM filaments WHERE id = ?", [filament_id]);
    const filament = (filamentRows as any[])[0];
    if (!filament) return NextResponse.json({ error: "Filamento não encontrado" }, { status: 404 });

    // Fetch global config
    const [configRows] = await pool.query("SELECT * FROM business_config WHERE id = 1");
    const config = (configRows as any[])[0];

    // Fetch client discount if client_id exists
    let clientDiscount = 0;
    if (client_id) {
      const [clientRows] = await pool.query("SELECT discount_margin_pct FROM clients WHERE id = ?", [client_id]);
      const client = (clientRows as any[])[0];
      if (client?.discount_margin_pct) clientDiscount = Number(client.discount_margin_pct);
    }
    const effectiveProfitMargin = Math.max(0, Number(config.default_profit_margin_pct) - clientDiscount);

    const calcInput = {
      print_time_hours: Number(print_time_hours),
      filament_used_g: Number(filament_used_g),
      setup_time_hours: Number(setup_time_hours),
      post_process_hours: Number(post_process_hours),
      quantity: Number(quantity),
      energy_kwh_price: Number(config.energy_kwh_price),
      labor_hourly_rate: Number(config.labor_hourly_rate),
      profit_margin_pct: Number(body_profit_margin_pct ?? effectiveProfitMargin),
      loss_pct: Number(body_loss_pct ?? config.default_loss_pct),
      spare_parts_pct: Number(body_spare_parts_pct ?? config.spare_parts_reserve_pct),
      power_watts: Number(printer.power_watts),
      purchase_price: Number(printer.purchase_price),
      lifespan_hours: Number(printer.lifespan_hours),
      maintenance_reserve_pct: Number(printer.maintenance_reserve_pct),
      cost_per_kg: Number(filament.cost_per_kg),
      packaging_cost: Number(config.packaging_cost || 0),
      bom_cost: 0,
    };

    // Calculate BOM cost if items provided
    const bom_cost = Array.isArray(bomItems) ? await (async () => {
      let total = 0;
      for (const item of bomItems) {
        const [rows] = await pool.query("SELECT cost_per_unit FROM consumables WHERE id = ?", [item.consumable_id]);
        const cons = (rows as any[])[0];
        if (cons) total += Number(cons.cost_per_unit) * Number(item.quantity);
      }
      return total;
    })() : 0;
    calcInput.bom_cost = bom_cost;

    const costs = calculateCosts(calcInput);

    // Extras (products & services)
    const extrasArray = Array.isArray(extras) ? extras : [];
    const extras_total = parseFloat(
      extrasArray.reduce((sum: number, e: any) => sum + Number(e.price || 0) * Number(e.quantity || 1), 0).toFixed(2)
    );
    const final_price_with_extras = parseFloat((costs.final_price + extras_total).toFixed(2));
    const final_price_per_unit_with_extras = parseFloat((final_price_with_extras / calcInput.quantity).toFixed(2));

    // Tax calculation for snapshot
    const tax_pct_applied = Number(config.default_tax_pct || 0);
    const tax_amount = parseFloat(((final_price_with_extras * tax_pct_applied) / 100).toFixed(2));

    const [result] = await pool.query(
      `INSERT INTO quotes (
        title, client_id, public_token, file_url, file_urls, reference_images, printer_id, filament_id, print_time_hours, filament_used_g,
        setup_time_hours, post_process_hours, quantity,
        energy_kwh_price, labor_hourly_rate, profit_margin_pct, loss_pct, spare_parts_pct,
        printer_power_watts, printer_purchase_price, printer_lifespan_hours, printer_maintenance_pct,
        filament_cost_per_kg,
        cost_filament, cost_energy, cost_depreciation, cost_maintenance, cost_labor,
        cost_losses, cost_spare_parts, cost_total_production, profit_value,
        final_price, final_price_per_unit, extras, extras_total, valid_days, notes,
        tax_pct_applied, tax_amount, status
      ) VALUES (?,?,UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        title || null,
        client_id || null,
        file_urls.length > 0 ? file_urls[0] : null,
        file_urls.length > 0 ? JSON.stringify(file_urls) : null,
        reference_images.length > 0 ? JSON.stringify(reference_images) : null,
        printer_id, filament_id,
        calcInput.print_time_hours, calcInput.filament_used_g,
        calcInput.setup_time_hours, calcInput.post_process_hours, calcInput.quantity,
        calcInput.energy_kwh_price, calcInput.labor_hourly_rate,
        calcInput.profit_margin_pct, calcInput.loss_pct, calcInput.spare_parts_pct,
        calcInput.power_watts, calcInput.purchase_price, calcInput.lifespan_hours, calcInput.maintenance_reserve_pct,
        calcInput.cost_per_kg,
        costs.cost_filament, costs.cost_energy, costs.cost_depreciation, costs.cost_maintenance, costs.cost_labor,
        costs.cost_losses, costs.cost_spare_parts, costs.cost_total_production, costs.profit_value,
        final_price_with_extras, final_price_per_unit_with_extras,
        extrasArray.length ? JSON.stringify(extrasArray) : null,
        extras_total,
        Number(valid_days) || 30,
        notes || null,
        tax_pct_applied,
        tax_amount,
        'quoted'
      ]
    );

    const id = (result as any).insertId;

    // Insert BOM items if any
    if (Array.isArray(bomItems) && bomItems.length > 0) {
      const bomValues = bomItems.map((it: any) => [id, it.consumable_id, it.quantity]);
      await pool.query(
        "INSERT INTO quote_bom (quote_id, consumable_id, quantity) VALUES ?",
        [bomValues]
      );
    }
    const [rows] = await pool.query(
      `SELECT q.*, p.name AS printer_name, f.name AS filament_name,
              c.name AS client_name, c.company AS client_company, c.email AS client_email
       FROM quotes q
       JOIN printers p ON q.printer_id = p.id
       JOIN filaments f ON q.filament_id = f.id
       LEFT JOIN clients c ON q.client_id = c.id
       WHERE q.id = ?`,
      [id]
    );

    const quote = (rows as any[])[0];

    if (request_id) {
      await pool.query(
        "UPDATE quote_requests SET status = 'quoted', quote_id = ? WHERE id = ?",
        [id, request_id]
      );
    }

    // Send email if requested and client has email
    if (send_email && quote.client_email) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        await sendQuoteEmail({
          to: quote.client_email,
          clientName: quote.client_name,
          quoteTitle: quote.title || `Cotação #${quote.id}`,
          portalUrl: `${baseUrl}/portal/${quote.public_token}`,
          lang: config.language_default || "pt"
        });
      } catch (mailErr) {
        console.error("Failed to send quote email:", mailErr);
        // We don't return error here because the quote was already created successfully
      }
    }

    return NextResponse.json(quote, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
