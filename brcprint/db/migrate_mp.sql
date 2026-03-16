-- Add Mercado Pago configuration columns to business_config

ALTER TABLE business_config
ADD COLUMN enable_mercadopago TINYINT(1) DEFAULT 0,
ADD COLUMN mp_access_token VARCHAR(255) NULL,
ADD COLUMN mp_public_key VARCHAR(255) NULL;
