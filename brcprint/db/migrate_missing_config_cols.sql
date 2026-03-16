ALTER TABLE business_config
ADD COLUMN packaging_length DECIMAL(6,2) DEFAULT 0,
ADD COLUMN packaging_width DECIMAL(6,2) DEFAULT 0,
ADD COLUMN packaging_height DECIMAL(6,2) DEFAULT 0,
ADD COLUMN packaging_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN shipping_api_provider VARCHAR(50) DEFAULT 'none',
ADD COLUMN shipping_api_token VARCHAR(255),
ADD COLUMN default_tax_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN enable_cashback BOOLEAN DEFAULT 0,
ADD COLUMN cashback_pct DECIMAL(5,2) DEFAULT 5.00;
