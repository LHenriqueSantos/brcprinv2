import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(session?.user as any).id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const client_id = (session.user as any).id;
    const body = await req.json();

    const {
      title, description, reference_photos,
      client_zipcode, client_address, client_address_number, client_address_comp,
      client_neighborhood, client_city, client_state, client_document, client_name,
      delivery_method, material_preference, estimated_dimensions
    } = body;

    if (!description || description.trim().length < 10) {
      return NextResponse.json({ error: "Por favor, descreva o que precisa com pelo menos 10 caracteres." }, { status: 400 });
    }

    const publicToken = crypto.randomUUID();

    // Insert into quote_requests with request_type = 'manual'
    const [qrResult] = await pool.query(
      `INSERT INTO quote_requests (
        title, client_id, request_type, manual_description, reference_photos, notes,
        client_zipcode, client_address, client_address_number, client_address_comp,
        client_neighborhood, client_city, client_state, client_document, client_name,
        file_url, file_urls, material_preference, status
      ) VALUES (?, ?, 'manual', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '[]', ?, 'pending')`,
      [
        title || "Orçamento Personalizado",
        client_id,
        description.trim(),
        JSON.stringify(reference_photos || []),
        estimated_dimensions ? `Dimensões estimadas: ${estimated_dimensions}` : null,
        delivery_method !== 'pickup' ? client_zipcode : null,
        delivery_method !== 'pickup' ? client_address : null,
        delivery_method !== 'pickup' ? client_address_number : null,
        delivery_method !== 'pickup' ? client_address_comp : null,
        delivery_method !== 'pickup' ? client_neighborhood : null,
        delivery_method !== 'pickup' ? client_city : null,
        delivery_method !== 'pickup' ? client_state : null,
        client_document || null,
        client_name || null,
        material_preference || "PLA",
      ]
    );

    const requestId = (qrResult as any).insertId;

    // Notify admin via WhatsApp if configured
    try {
      const [cfgRows]: any = await pool.query("SELECT * FROM business_config WHERE id = 1");
      const cfg = cfgRows[0];
      if (cfg?.whatsapp_notif_number && cfg?.whatsapp_access_token) {
        const msg = `📝 *Novo Orçamento Manual Recebido!*\n\nCliente: ${client_name || "Não informado"}\n📦 Projeto: ${title || "Orçamento Personalizado"}\n📋 Descrição: ${description.substring(0, 200)}...\n\nAcesse o painel e defina o preço! ✅`;
        await fetch(`https://api.z-api.io/instances/${cfg.whatsapp_instance_id}/token/${cfg.whatsapp_access_token}/send-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cfg.whatsapp_notif_number, message: msg })
        });
      }
    } catch (e) {
      console.error("WhatsApp notification failed:", e);
    }

    return NextResponse.json({ success: true, request_id: requestId, pending: true });
  } catch (err: any) {
    console.error("Manual quote error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
