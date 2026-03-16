import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // 1. Check if WhatsApp is enabled globally
    const [configRows]: any = await pool.query(
      "SELECT enable_whatsapp, whatsapp_api_url, whatsapp_instance_id, whatsapp_api_token, language_default FROM business_config WHERE id = 1"
    );
    const config = configRows[0];

    if (!config || !config.enable_whatsapp || !config.whatsapp_api_url) {
      return NextResponse.json({
        success: false,
        message: "WhatsApp is not configured or disabled in business_config. CRON will not run.",
      });
    }

    // 2. Find quotes delivered more than 48 hours ago where review was not yet requested
    // Adjust interval if needed (e.g. 48 HOUR)
    const [quotes]: any = await pool.query(`
      SELECT q.id, q.public_token, q.title, c.name as client_name, c.phone as client_phone
      FROM quotes q
      JOIN clients c ON q.client_id = c.id
      WHERE q.status = 'delivered'
        AND q.updated_at < (NOW() - INTERVAL 48 HOUR)
        AND q.review_requested_at IS NULL
    `);

    if (quotes.length === 0) {
      return NextResponse.json({ success: true, message: "No pending reviews to request at this time." });
    }

    let successCount = 0;
    let failCount = 0;

    const authHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.whatsapp_api_token}`
    };

    // Construct the base URL for the portal
    // Assuming standard format, ideally from an env var, using request host as fallback
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    // 3. Process each eligible quote
    for (const q of quotes) {
      if (!q.client_phone) {
        failCount++;
        continue;
      }

      // Format phone number to international
      let phone = String(q.client_phone).replace(/\D/g, "");
      if (phone.length === 11 || phone.length === 10) {
        phone = "55" + phone;
      }

      const reviewUrl = `${baseUrl}/portal/${q.public_token}/avaliar`;

      const greeting = config.language_default === 'en' ? 'Hello' : config.language_default === 'es' ? '¡Hola' : 'Olá';

      const messageBody = `*${greeting}, ${q.client_name}!*
Esperamos que você esteja aproveitando a sua peça 3D (${q.title}).
Adoraríamos saber o que você achou! Sua opinião é fundamental para nós.

Por favor, tire 1 minutinho para avaliar o seu pedido e, se puder, mandar uma foto da peça pra gente! 😊

👉 *Avalie aqui:* ${reviewUrl}

Muito obrigado por escolher nossos serviços!`;

      try {
        const payload = {
          number: phone,
          options: {
            delay: 1200,
            presence: "composing"
          },
          textMessage: {
            text: messageBody
          }
        };

        const wpUrl = `${config.whatsapp_api_url}/message/sendText/${config.whatsapp_instance_id}`;

        const wpRes = await fetch(wpUrl, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(payload)
        });

        if (wpRes.ok) {
          // Success! Mark as requested in the DB to avoid resending
          await pool.query("UPDATE quotes SET review_requested_at = NOW() WHERE id = ?", [q.id]);
          successCount++;
        } else {
          console.error(`[Review CRON] WP API Error for Quote #${q.id}:`, await wpRes.text());
          failCount++;
        }
      } catch (err) {
        console.error(`[Review CRON] Network Error sending WP message for Quote #${q.id}:`, err);
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${quotes.length} review requests. Sent: ${successCount}. Failed: ${failCount}.`,
      processed: quotes.length,
      sent: successCount
    });

  } catch (error: any) {
    console.error("[Review CRON] General error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
