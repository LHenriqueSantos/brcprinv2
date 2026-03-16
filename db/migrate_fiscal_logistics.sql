-- Add Logistics and Fiscal Configuration Columns
ALTER TABLE business_config
  ADD COLUMN melhorenvio_token VARCHAR(2000) DEFAULT NULL,
  ADD COLUMN focusnfe_token VARCHAR(255) DEFAULT NULL,
  ADD COLUMN focusnfe_environment ENUM('sandbox', 'production') DEFAULT 'sandbox',
  ADD COLUMN default_nfe_type ENUM('nfse', 'nfe') DEFAULT 'nfse';

-- Add Fiscal and Logistics tracking columns to quotes
ALTER TABLE quotes
  ADD COLUMN nfe_status VARCHAR(50) DEFAULT NULL,
  ADD COLUMN nfe_url VARCHAR(255) DEFAULT NULL,
  ADD COLUMN melhorenvio_order_id VARCHAR(100) DEFAULT NULL;
