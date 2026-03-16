-- Increase length of token and URL columns in business_config
ALTER TABLE business_config
    MODIFY COLUMN shipping_api_token TEXT,
    MODIFY COLUMN mp_access_token TEXT,
    MODIFY COLUMN whatsapp_api_token TEXT,
    MODIFY COLUMN stripe_secret_key TEXT,
    MODIFY COLUMN webhook_url TEXT;
