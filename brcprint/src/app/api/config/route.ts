import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { checkAdmin, checkAnyAuth, forbiddenResponse } from "@/lib/adminCheck";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM business_config WHERE id = 1");
    const data = (rows as any[])[0] || {};
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!await checkAdmin()) return forbiddenResponse();
  try {
    const body = await req.json();
    console.log("Config PUT payload:", body);

    const {
      energy_kwh_price,
      labor_hourly_rate,
      default_profit_margin_pct,
      default_loss_pct,
      spare_parts_reserve_pct,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_pass,
      sender_email,
      enable_3d_viewer,
      enable_timeline,
      enable_chat,
      enable_stripe,
      stripe_public_key,
      stripe_secret_key,
      enable_auto_quoting,
      enable_whatsapp,
      whatsapp_api_url,
      whatsapp_instance_id,
      whatsapp_api_token,
      company_zipcode,
      company_address,
      company_number,
      company_complement,
      company_neighborhood,
      company_city,
      company_state,
      packaging_length,
      packaging_width,
      packaging_height,
      packaging_cost,
      shipping_api_provider,
      shipping_api_token,
      currency_code,
      currency_symbol,
      language_default,
      default_tax_pct,
      enable_mercadopago,
      mp_access_token,
      mp_public_key,
      enable_cashback,
      cashback_pct,
      api_key,
      webhook_url,
      enable_multicolor,
      multicolor_markup_pct,
      multicolor_waste_g,
      multicolor_hours_added,
      energy_flag,
      energy_peak_price,
      energy_off_peak_price,
      energy_peak_start,
      energy_peak_end,
    } = body;

    const num = (v: any) => v === "" || v === undefined || v === null ? 0 : v;

    const configData: Record<string, any> = {
      energy_kwh_price: num(energy_kwh_price),
      labor_hourly_rate: num(labor_hourly_rate),
      default_profit_margin_pct: num(default_profit_margin_pct),
      default_loss_pct: num(default_loss_pct),
      spare_parts_reserve_pct: num(spare_parts_reserve_pct),
      smtp_host,
      smtp_port: num(smtp_port),
      smtp_user,
      smtp_pass,
      sender_email,
      enable_3d_viewer: enable_3d_viewer ? 1 : 0,
      enable_timeline: enable_timeline ? 1 : 0,
      enable_chat: enable_chat ? 1 : 0,
      enable_stripe: enable_stripe ? 1 : 0,
      stripe_public_key,
      stripe_secret_key,
      enable_auto_quoting: enable_auto_quoting ? 1 : 0,
      enable_whatsapp: enable_whatsapp ? 1 : 0,
      whatsapp_api_url,
      whatsapp_instance_id,
      whatsapp_api_token,
      company_zipcode,
      company_address,
      company_number,
      company_complement,
      company_neighborhood,
      company_city,
      company_state,
      packaging_length: num(packaging_length),
      packaging_width: num(packaging_width),
      packaging_height: num(packaging_height),
      packaging_cost: num(packaging_cost),
      shipping_api_provider,
      shipping_api_token,
      currency_code: currency_code || 'BRL',
      currency_symbol: currency_symbol || 'R$',
      language_default: language_default || 'pt',
      default_tax_pct: num(default_tax_pct),
      enable_mercadopago: enable_mercadopago ? 1 : 0,
      mp_access_token,
      mp_public_key,
      enable_cashback: enable_cashback ? 1 : 0,
      cashback_pct: num(cashback_pct),
      api_key,
      webhook_url,
      enable_multicolor: enable_multicolor ? 1 : 0,
      multicolor_markup_pct: num(multicolor_markup_pct),
      multicolor_waste_g: num(multicolor_waste_g),
      multicolor_hours_added: num(multicolor_hours_added),
      energy_flag: energy_flag || 'green',
      energy_peak_price: num(energy_peak_price),
      energy_off_peak_price: num(energy_off_peak_price),
      energy_peak_start: energy_peak_start || '18:00:00',
      energy_peak_end: energy_peak_end || '21:00:00'
    };

    const columns = Object.keys(configData);
    const placeholders = columns.map(() => "?").join(", ");
    const updateClause = columns.map(c => `${c} = VALUES(${c})`).join(", ");
    const values = Object.values(configData);

    const sql = `
      INSERT INTO business_config (id, ${columns.join(", ")})
      VALUES (1, ${placeholders})
      ON DUPLICATE KEY UPDATE ${updateClause}
    `;

    console.log("Config SQL parameters count:", values.length);
    await pool.query(sql, values);

    const [rows] = await pool.query("SELECT * FROM business_config WHERE id = 1");
    return NextResponse.json((rows as any[])[0]);
  } catch (err: any) {
    console.error("Config API SQL Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
