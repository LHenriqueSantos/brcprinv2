-- Configs for the new features (Phase 12-16)
ALTER TABLE business_config ADD COLUMN enable_3d_viewer BOOLEAN NOT NULL DEFAULT 1;
ALTER TABLE business_config ADD COLUMN enable_timeline BOOLEAN NOT NULL DEFAULT 1;
ALTER TABLE business_config ADD COLUMN enable_chat BOOLEAN NOT NULL DEFAULT 1;
ALTER TABLE business_config ADD COLUMN enable_stripe BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE business_config ADD COLUMN stripe_public_key VARCHAR(255) DEFAULT '';
ALTER TABLE business_config ADD COLUMN stripe_secret_key VARCHAR(255) DEFAULT '';
ALTER TABLE business_config ADD COLUMN enable_auto_quoting BOOLEAN NOT NULL DEFAULT 0;
