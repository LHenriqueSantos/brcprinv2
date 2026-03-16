-- Migration Phase 60: External API & Webhooks
ALTER TABLE business_config ADD COLUMN api_key VARCHAR(255) DEFAULT NULL;
ALTER TABLE business_config ADD COLUMN webhook_url VARCHAR(255) DEFAULT NULL;
