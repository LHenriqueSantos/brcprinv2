-- Migrate quotes table to support MercadoPago PIX integration

ALTER TABLE quotes
ADD COLUMN payment_method VARCHAR(50) NULL COMMENT 'e.g., pix, stripe',
ADD COLUMN mp_payment_id BIGINT NULL COMMENT 'MercadoPago Payment ID',
ADD COLUMN pix_qr_code TEXT NULL COMMENT 'Pix Copia e Cola String',
ADD COLUMN pix_qr_code_base64 TEXT NULL COMMENT 'Base64 image of the QR Code';

-- Optional: If you want to track payment history more robustly, you could create a separate payments table,
-- but appending to quotes is simpler for this POC flow.
