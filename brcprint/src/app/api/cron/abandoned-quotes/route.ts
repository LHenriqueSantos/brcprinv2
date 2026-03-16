import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendRecoveryEmail } from "@/lib/mail";

// Force dynamic resolution of this route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Validate Secret Token
    // We check either the Authorization: Bearer Header or a ?secret= querystring
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get('secret');

    const validSecret = process.env.CRON_SECRET || 'brcprint-cron-secret-2024';

    if (authHeader !== `Bearer ${validSecret}` && querySecret !== validSecret) {
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // 2. Query configurations (business_config & locales)
    const [configRows] = await pool.query("SELECT * FROM business_config WHERE id = 1");
    const config = (configRows as any[])[0] || {};
    const lang = config.language_default || "pt";

    // 3. Find abandoned quotes (Created more than 24 hours ago, still pending/quoted, email not sent yet)
    const [qRows] = await pool.query(`
      SELECT q.id, q.public_token, q.client_id, c.name, c.email, c.phone, q.created_at
      FROM quotes q
      JOIN clients c ON q.client_id = c.id
      WHERE q.status IN ('pending', 'quoted')
        AND q.abandonment_email_sent = 0
        AND q.created_at < NOW() - INTERVAL 24 HOUR
    `);

    const quotes = qRows as any[];
    let emailsSent = 0;
    let whatsappSent = 0;
    const processedIds: number[] = [];

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    for (const quote of quotes) {
      const portalUrl = `${baseUrl}/portal/${quote.public_token}`;
      let success = false;

      // 4. Send Email Reminder
      try {
        if (quote.email) {
          if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST) {
            console.log(`[MOCK] Sending recovery email to ${quote.email} for Quote ${quote.id}`);
            success = true;
            emailsSent++;
          } else {
            await sendRecoveryEmail({
              to: quote.email,
              clientName: quote.name?.split(' ')[0] || "Cliente",
              portalUrl,
              lang: lang,
            });
            success = true;
            emailsSent++;
          }
        }
      } catch (e: any) {
        console.error(`Falha ao enviar e-mail de abandono para Quote ${quote.id}:`, e.message);
      }

      // 5. Send WhatsApp Reminder (if configured)
      if (config.enable_whatsapp && config.whatsapp_api_url && quote.phone) {
        try {
          const formattedPhone = quote.phone.replace(/\D/g, "");

          let wppMsg = `Olá ${quote.name?.split(' ')[0]}! Percebemos que seu projeto 3D (Cotação #${quote.id}) está aguardando você.`;
          wppMsg += `\n\nQue tal fecharmos hoje? Acesse este link prático para prosseguir: ${portalUrl}`;

          const payload = {
            number: "55" + formattedPhone,
            options: {
              delay: 2000,
              presence: "composing",
              linkPreview: true
            },
            textMessage: { text: wppMsg }
          };

          await fetch(config.whatsapp_api_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(config.whatsapp_api_token ? { 'apikey': config.whatsapp_api_token, 'Authorization': `Bearer ${config.whatsapp_api_token}` } : {})
            },
            body: JSON.stringify(payload)
          });
          success = true;
          whatsappSent++;
        } catch (we: any) {
          console.error(`Falha ao enviar WhatsApp de abandono para Quote ${quote.id}:`, we.message);
        }
      }

      // 6. Update DB only if at least one contact attempt worked or if no contact info was available
      if (success) {
        await pool.query("UPDATE quotes SET abandonment_email_sent = 1 WHERE id = ?", [quote.id]);
        processedIds.push(quote.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Rotina de recuperação de carrinho finalizada.",
      processed_count: processedIds.length,
      emails_sent: emailsSent,
      whatsapp_sent: whatsappSent,
      quotes_updated: processedIds
    });

  } catch (error: any) {
    console.error("Erro CRON abandoned-quotes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
