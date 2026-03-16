ALTER TABLE clients
ADD COLUMN discount_margin_pct DECIMAL(5,2) DEFAULT 0 COMMENT 'Porcentagem de desconto na margem de lucro para clientes VIP/B2B';
