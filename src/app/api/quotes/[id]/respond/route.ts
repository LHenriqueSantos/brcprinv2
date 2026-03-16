import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { createAffiliateProfile } from "@/lib/createAffiliate";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { token, action, counter_offer_price, counter_offer_notes, shipping_service, shipping_cost, address_data, credits_used } = body;

    // Auto-migrate state columns to avoid "Data too long" errors when saving full states
    try {
      await pool.query("ALTER TABLE business_config MODIFY COLUMN company_state VARCHAR(50) DEFAULT NULL");
      await pool.query("ALTER TABLE clients MODIFY COLUMN state VARCHAR(50) DEFAULT NULL");
      await pool.query("ALTER TABLE quotes MODIFY COLUMN client_state VARCHAR(50) DEFAULT NULL");
      await pool.query("ALTER TABLE quote_requests MODIFY COLUMN client_state VARCHAR(50) DEFAULT NULL");
    } catch (e) { /* ignore */ }

    // Validate token
    const [rows] = await pool.query(
      "SELECT id, public_token, status FROM quotes WHERE id = ?",
      [id]
    );
    const quote = (rows as any[])[0];
    if (!quote) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
    if (quote.public_token !== token) return NextResponse.json({ error: "Token inválido" }, { status: 403 });
    if (quote.status !== "pending" && quote.status !== "quoted") return NextResponse.json({ error: "Cotação já respondida ou não disponível para ação" }, { status: 409 });

    const validActions = ["approved", "counter_offer", "rejected", "identify"];
    if (!validActions.includes(action)) return NextResponse.json({ error: "Ação inválida" }, { status: 400 });

    // Identify action doesn't change main status, just updates data
    let dbStatus = quote.status;
    if (action === 'approved') dbStatus = 'awaiting_payment';
    if (action === 'counter_offer') dbStatus = 'counter_offer';
    if (action === 'rejected') dbStatus = 'rejected';

    await pool.query(
      `UPDATE quotes SET
        status = ?,
        counter_offer_price = ?,
        counter_offer_notes = ?,
        shipping_service = ?,
        shipping_cost = ?,
        final_price = CASE WHEN ? IS NOT NULL THEN (final_price - COALESCE(shipping_cost, 0) + ?) ELSE final_price END,
        credits_used = COALESCE(?, credits_used),
        responded_at = CASE WHEN ? != 'identify' THEN NOW() ELSE responded_at END
       WHERE id = ?`,
      [
        dbStatus, counter_offer_price || null, counter_offer_notes || null,
        shipping_service !== undefined ? shipping_service : quote.shipping_service,
        shipping_cost !== undefined ? Number(shipping_cost) : quote.shipping_cost,
        shipping_cost !== undefined ? Number(shipping_cost) : null,
        shipping_cost !== undefined ? Number(shipping_cost) : 0,
        credits_used !== undefined ? credits_used : 0,
        action,
        id
      ]
    );

    let accountCreated = false;
    let linkedClientId: number | null = null;

    if (address_data && (action === 'approved' || action === 'identify')) {
      await pool.query(
        `UPDATE quotes SET
          client_zipcode = ?, client_address = ?, client_address_number = ?,
          client_address_comp = ?, client_neighborhood = ?, client_city = ?,
          client_state = ?, client_document = ?, client_name = ?,
          client_email = ?, client_phone = ?
         WHERE id = ?`,
        [
          address_data.client_zipcode, address_data.client_address, address_data.client_address_number,
          address_data.client_address_comp || "", address_data.client_neighborhood, address_data.client_city,
          address_data.client_state, address_data.client_document, address_data.client_name,
          address_data.client_email || null, address_data.client_phone || null, id
        ]
      );

      if (address_data.client_email) {
        // Hash password if provided (min 6 chars)
        let passwordHash: string | null = null;
        if (address_data.password && address_data.password.length >= 6) {
          passwordHash = await bcrypt.hash(address_data.password, 10);
        }

        const [existing] = await pool.query(
          "SELECT id, password_hash FROM clients WHERE email = ? LIMIT 1",
          [address_data.client_email]
        );

        let clientId: number;
        if ((existing as any[]).length > 0) {
          clientId = (existing as any[])[0].id;
          const existingHash = (existing as any[])[0].password_hash;
          // Update info; set password only if client had none (opt-in upgrade)
          const extraSet = passwordHash && !existingHash ? ', password_hash = ?' : '';
          const extraArgs = passwordHash && !existingHash ? [passwordHash] : [];
          await pool.query(
            `UPDATE clients SET name = ?, phone = ?, document = ?, zipcode = ?, address = ?, address_number = ?, address_comp = ?, neighborhood = ?, city = ?, state = ?${extraSet} WHERE id = ?`,
            [
              address_data.client_name, address_data.client_phone || null, address_data.client_document || null,
              address_data.client_zipcode || null, address_data.client_address || null, address_data.client_address_number || null,
              address_data.client_address_comp || null, address_data.client_neighborhood || null, address_data.client_city || null,
              address_data.client_state || null,
              ...extraArgs, clientId
            ]
          );
          if (passwordHash) accountCreated = true;
        } else {
          const [ins] = await pool.query(
            `INSERT INTO clients (name, email, phone, document, password_hash, zipcode, address, address_number, address_comp, neighborhood, city, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              address_data.client_name, address_data.client_email, address_data.client_phone || null, address_data.client_document || null, passwordHash,
              address_data.client_zipcode || null, address_data.client_address || null, address_data.client_address_number || null,
              address_data.client_address_comp || null, address_data.client_neighborhood || null, address_data.client_city || null,
              address_data.client_state || null
            ]
          );
          clientId = (ins as any).insertId;
          if (passwordHash) accountCreated = true;

          await createAffiliateProfile(address_data.client_name, address_data.client_email);
        }

        await pool.query("UPDATE quotes SET client_id = ? WHERE id = ?", [clientId, id]);
        linkedClientId = clientId;
      }
    }

    return NextResponse.json({ success: true, status: action, account_created: accountCreated, client_id: linkedClientId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
