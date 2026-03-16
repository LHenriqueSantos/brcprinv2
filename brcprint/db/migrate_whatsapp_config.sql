-- Add WhatsApp Webhook settings to business_config
ALTER TABLE business_config ADD COLUMN enable_whatsapp BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE business_config ADD COLUMN whatsapp_api_url VARCHAR(255) DEFAULT '';
ALTER TABLE business_config ADD COLUMN whatsapp_instance_id VARCHAR(255) DEFAULT '';
ALTER TABLE business_config ADD COLUMN whatsapp_api_token VARCHAR(255) DEFAULT '';
