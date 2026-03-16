import pool from "./db";

export async function sendWhatsAppMessage(to: string, message: string) {
  try {
    const [rows] = await pool.query("SELECT enable_whatsapp, whatsapp_api_url, whatsapp_instance_id, whatsapp_api_token FROM business_config WHERE id = 1");
    const config = (rows as any[])[0];

    if (!config || !config.enable_whatsapp) {
      console.log("[WhatsApp] Service disabled in config. Skipping message.");
      return false;
    }

    if (!config.whatsapp_api_url || !config.whatsapp_instance_id || !config.whatsapp_api_token) {
      console.error("[WhatsApp] Missing API configuration (URL, Instance, or Token).");
      return false;
    }

    // Clean phone number (remove non-digits, ensure country code)
    let phone = to.replace(/\D/g, '');
    if (phone.length === 10 || phone.length === 11) {
      phone = `55${phone}`; // Assert BR code if missing
    }

    // Format for Evolution API / Z-API style
    // POST /message/sendText/{instanceName}
    const apiUrl = `${config.whatsapp_api_url.replace(/\/$/, '')}/message/sendText/${config.whatsapp_instance_id}`;

    console.log(`[WhatsApp] Sending message to ${phone}...`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.whatsapp_api_token
      },
      body: JSON.stringify({
        number: phone,
        options: {
          delay: 1200,
          presence: "composing",
        },
        textMessage: {
          text: message
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[WhatsApp] API Error (${response.status}):`, errorText);
      return false;
    }

    const data = await response.json();
    console.log("[WhatsApp] Message sent successfully:", data);
    return true;

  } catch (error) {
    console.error("[WhatsApp] Internal Error:", error);
    return false;
  }
}
