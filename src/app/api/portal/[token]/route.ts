import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const PORTAL_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "portal_fallback_secret_change_me"
);

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const [rows] = await pool.query(
      `SELECT q.*, p.name AS printer_name, p.model AS printer_model,
              f.name AS filament_name, f.type AS filament_type, f.color AS filament_color,
              c.name AS client_name, c.company AS client_company,
              c.email AS client_email, c.phone AS client_phone, c.credit_balance,
              c.password_hash IS NOT NULL AS client_has_password,
              c.document AS c_document,
              c.zipcode AS c_zipcode,
              c.address AS c_address,
              c.address_number AS c_address_number,
              c.address_comp AS c_address_comp,
              c.neighborhood AS c_neighborhood,
              c.city AS c_city,
              c.state AS c_state,
              q.file_url, q.file_urls
       FROM quotes q
       JOIN printers p ON q.printer_id = p.id
       JOIN filaments f ON q.filament_id = f.id
       LEFT JOIN clients c ON q.client_id = c.id
       LEFT JOIN quote_requests qr ON qr.quote_id = q.id
       WHERE q.public_token = ?`,
      [token]
    );
    if (!(rows as any[]).length) {
      return NextResponse.json({ error: "Cotação não encontrada ou link inválido" }, { status: 404 });
    }

    const quote = (rows as any[])[0];

    // Auto-fill from client profile if missing in the quote
    quote.client_document = quote.client_document || quote.c_document;
    quote.client_zipcode = quote.client_zipcode || quote.c_zipcode;
    quote.client_address = quote.client_address || quote.c_address;
    quote.client_address_number = quote.client_address_number || quote.c_address_number;
    quote.client_address_comp = quote.client_address_comp || quote.c_address_comp;
    quote.client_neighborhood = quote.client_neighborhood || quote.c_neighborhood;
    quote.client_city = quote.client_city || quote.c_city;
    quote.client_state = quote.client_state || quote.c_state;

    if (quote.created_at && quote.valid_days) {
      const validUntil = new Date(quote.created_at);
      validUntil.setDate(validUntil.getDate() + Number(quote.valid_days));
      quote.valid_until = validUntil.toISOString();
    }

    const [cRows] = await pool.query(`
      SELECT
        enable_3d_viewer, enable_timeline, enable_chat, enable_stripe,
        company_zipcode, company_address, company_city, company_state,
        packaging_length, packaging_width, packaging_height, packaging_cost,
        shipping_api_provider, shipping_api_token,
        currency_code, currency_symbol, language_default, default_tax_pct,
        enable_cashback, cashback_pct
      FROM business_config WHERE id = 1
    `);
    quote.config = (cRows as any[])[0] || {};

    return NextResponse.json(quote);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Portal login: validate client credentials for a specific quote
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 });
    }

    const [qRows] = await pool.query(
      `SELECT q.id, q.client_id, c.email AS client_email, c.password_hash
       FROM quotes q
       JOIN clients c ON q.client_id = c.id
       WHERE q.public_token = ?`,
      [token]
    );
    const row = (qRows as any[])[0];

    if (!row) {
      return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
    }
    if (!row.password_hash) {
      return NextResponse.json({ success: true });
    }
    if (row.client_email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: "E-mail incorreto para esta cotação" }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 403 });
    }

    const jwt = await new SignJWT({ client_id: row.client_id, quote_token: token })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(PORTAL_SECRET);

    const response = NextResponse.json({ success: true });
    response.cookies.set("portal_session", jwt, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/"
    });
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
