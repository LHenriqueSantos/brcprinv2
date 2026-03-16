import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { checkAdmin, forbiddenResponse } from '@/lib/adminCheck';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(req: Request) {
  if (!await checkAdmin()) return forbiddenResponse();

  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Número de telefone é obrigatório.' }, { status: 400 });
    }

    const [rows] = await pool.query('SELECT enable_whatsapp, whatsapp_api_url, whatsapp_instance_id, whatsapp_api_token FROM business_config WHERE id = 1');
    const config = (rows as any[])[0];

    if (!config?.enable_whatsapp || !config?.whatsapp_api_url || !config?.whatsapp_api_token) {
      return NextResponse.json({ success: false, error: 'Plataforma WhatsApp desabilitada ou incompleta.' }, { status: 400 });
    }

    const message = `✅ *Teste de Conexão: BRCPrint*\n\nSe você recebeu esta mensagem, sua API do WhatsApp (Evolution/Z-API) está configurada e comunicando com sucesso com nossos servidores! 🚀`;

    // Attempting to use the centralized sender if it exists in the system
    try {
      const success = await sendWhatsAppMessage(phone, message);
      if (success) {
        return NextResponse.json({ success: true });
      } else {
        throw new Error("sendWhatsAppMessage (lib) return false");
      }
    } catch (libErr) {
      // Fallback manual POST attempt based on URL syntax
      console.log("WhatsApp Lib Sending Failed or Unavailable, attempting raw fetch fallback...", libErr);

      let finalUrl = config.whatsapp_api_url;
      // Handle evolution API typical pattern if missing instance in URL
      if (config.whatsapp_instance_id && !finalUrl.includes(config.whatsapp_instance_id)) {
        if (!finalUrl.endsWith('/')) finalUrl += '/';
        finalUrl += `message/sendText/${config.whatsapp_instance_id}`;
      }

      const response = await fetch(finalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.whatsapp_api_token,
          'Authorization': `Bearer ${config.whatsapp_api_token}`
        },
        body: JSON.stringify({
          number: phone,
          textMessage: { text: message },
          options: { delay: 1200, linkPreview: false }
        })
      });

      if (!response.ok) {
        const apiRes = await response.text();
        throw new Error(`API de WhatsApp falhou com status ${response.status}: ${apiRes}`);
      }

      return NextResponse.json({ success: true, via: 'fallback' });
    }

  } catch (error: any) {
    console.error('Erro de teste WhatsApp:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
