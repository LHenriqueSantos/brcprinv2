
const pool = require('./src/lib/db').default;

async function test() {
  const body = {
    energy_kwh_price: 0.75,
    labor_hourly_rate: 50,
    default_profit_margin_pct: 20,
    default_loss_pct: 5,
    spare_parts_reserve_pct: 10,
    smtp_host: 'smtp.gmail.com',
    smtp_port: 465,
    smtp_user: 'test@gmail.com',
    smtp_pass: 'pass',
    sender_email: 'test@gmail.com',
    enable_3d_viewer: true,
    enable_timeline: true,
    enable_chat: true,
    enable_stripe: false,
    stripe_public_key: '',
    stripe_secret_key: '',
    enable_auto_quoting: false,
    enable_whatsapp: false,
    whatsapp_api_url: '',
    whatsapp_instance_id: '',
    whatsapp_api_token: '',
    company_zipcode: '12345678',
    packaging_length: 20,
    packaging_width: 20,
    packaging_height: 15,
    packaging_cost: 0,
    shipping_api_provider: 'none',
    shipping_api_token: '',
    currency_code: 'BRL',
    currency_symbol: 'R$',
    language_default: 'pt',
    default_tax_pct: 0,
    enable_mercadopago: false,
    mp_access_token: '',
    mp_public_key: '',
    enable_cashback: false,
    cashback_pct: 5,
    api_key: 'test_key',
    webhook_url: '',
    enable_multicolor: false,
    multicolor_markup_pct: 15,
    multicolor_waste_g: 50,
    multicolor_hours_added: 1.5,
    energy_flag: 'green',
    energy_peak_price: 1.2,
    energy_off_peak_price: 0.6,
    energy_peak_start: '18:00:00',
    energy_peak_end: '21:00:00'
  };

  const num = (v) => v === "" || v === undefined || v === null ? 0 : v;

  const values = [
    num(body.energy_kwh_price), num(body.labor_hourly_rate), num(body.default_profit_margin_pct), num(body.default_loss_pct), num(body.spare_parts_reserve_pct),
    body.smtp_host, num(body.smtp_port), body.smtp_user, body.smtp_pass, body.sender_email,
    body.enable_3d_viewer ? 1 : 0, body.enable_timeline ? 1 : 0, body.enable_chat ? 1 : 0,
    body.enable_stripe ? 1 : 0, body.stripe_public_key, body.stripe_secret_key, body.enable_auto_quoting ? 1 : 0,
    body.enable_whatsapp ? 1 : 0, body.whatsapp_api_url, body.whatsapp_instance_id, body.whatsapp_api_token, body.company_zipcode,
    num(body.packaging_length), num(body.packaging_width), num(body.packaging_height), num(body.packaging_cost), body.shipping_api_provider, body.shipping_api_token,
    body.currency_code || 'BRL', body.currency_symbol || 'R$', body.language_default || 'pt', num(body.default_tax_pct),
    body.enable_mercadopago ? 1 : 0, body.mp_access_token, body.mp_public_key,
    body.enable_cashback ? 1 : 0, num(body.cashback_pct),
    body.api_key, body.webhook_url,
    body.enable_multicolor ? 1 : 0, num(body.multicolor_markup_pct), num(body.multicolor_waste_g), num(body.multicolor_hours_added),
    body.energy_flag || 'green', num(body.energy_peak_price), num(body.energy_off_peak_price), body.energy_peak_start || '18:00:00', body.energy_peak_end || '21:00:00'
  ];

  try {
    await pool.query(
      `INSERT INTO business_config
          (id, energy_kwh_price, labor_hourly_rate, default_profit_margin_pct, default_loss_pct, spare_parts_reserve_pct,
           smtp_host, smtp_port, smtp_user, smtp_pass, sender_email,
           enable_3d_viewer, enable_timeline, enable_chat, enable_stripe, stripe_public_key, stripe_secret_key, enable_auto_quoting,
           enable_whatsapp, whatsapp_api_url, whatsapp_instance_id, whatsapp_api_token, company_zipcode,
           packaging_length, packaging_width, packaging_height, packaging_cost, shipping_api_provider, shipping_api_token,
           currency_code, currency_symbol, language_default, default_tax_pct, enable_mercadopago, mp_access_token, mp_public_key, enable_cashback, cashback_pct, api_key, webhook_url,
           enable_multicolor, multicolor_markup_pct, multicolor_waste_g, multicolor_hours_added,
            energy_flag, energy_peak_price, energy_off_peak_price, energy_peak_start, energy_peak_end)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        energy_kwh_price = VALUES(energy_kwh_price),
        labor_hourly_rate = VALUES(labor_hourly_rate),
        default_profit_margin_pct = VALUES(default_profit_margin_pct),
        default_loss_pct = VALUES(default_loss_pct),
        spare_parts_reserve_pct = VALUES(spare_parts_reserve_pct),
        smtp_host = VALUES(smtp_host),
        smtp_port = VALUES(smtp_port),
        smtp_user = VALUES(smtp_user),
        smtp_pass = VALUES(smtp_pass),
        sender_email = VALUES(sender_email),
        enable_3d_viewer = VALUES(enable_3d_viewer),
        enable_timeline = VALUES(enable_timeline),
        enable_chat = VALUES(enable_chat),
        enable_stripe = VALUES(enable_stripe),
        stripe_public_key = VALUES(stripe_public_key),
        stripe_secret_key = VALUES(stripe_secret_key),
        enable_auto_quoting = VALUES(enable_auto_quoting),
        enable_whatsapp = VALUES(enable_whatsapp),
        whatsapp_api_url = VALUES(whatsapp_api_url),
        whatsapp_instance_id = VALUES(whatsapp_instance_id),
        whatsapp_api_token = VALUES(whatsapp_api_token),
        company_zipcode = VALUES(company_zipcode),
        packaging_length = VALUES(packaging_length),
        packaging_width = VALUES(packaging_width),
        packaging_height = VALUES(packaging_height),
        packaging_cost = VALUES(packaging_cost),
        shipping_api_provider = VALUES(shipping_api_provider),
        shipping_api_token = VALUES(shipping_api_token),
        currency_code = VALUES(currency_code),
        currency_symbol = VALUES(currency_symbol),
        language_default = VALUES(language_default),
        default_tax_pct = VALUES(default_tax_pct),
        enable_mercadopago = VALUES(enable_mercadopago),
        mp_access_token = VALUES(mp_access_token),
        mp_public_key = VALUES(mp_public_key),
        enable_cashback = VALUES(enable_cashback),
        cashback_pct = VALUES(cashback_pct),
        api_key = VALUES(api_key),
        webhook_url = VALUES(webhook_url),
        enable_multicolor = VALUES(enable_multicolor),
        multicolor_markup_pct = VALUES(multicolor_markup_pct),
        multicolor_waste_g = VALUES(multicolor_waste_g),
        multicolor_hours_added = VALUES(multicolor_hours_added),
        energy_flag = VALUES(energy_flag),
        energy_peak_price = VALUES(energy_peak_price),
        energy_off_peak_price = VALUES(energy_off_peak_price),
        energy_peak_start = VALUES(energy_peak_start),
        energy_peak_end = VALUES(energy_peak_end)`,
      values
    );
    console.log("Success!");
  } catch (err) {
    console.error("FAILED:", err.message);
  } finally {
    process.exit();
  }
}

test();
