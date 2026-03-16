-- Atualização para Sistema de Frete Dinâmico (Fase 22)

-- Configuração Global da Empresa (CEP Origem)
ALTER TABLE business_config ADD COLUMN company_zipcode VARCHAR(20) DEFAULT '';

-- Pedidos do Cliente
ALTER TABLE quote_requests ADD COLUMN client_zipcode VARCHAR(20) DEFAULT NULL;

-- Cotações Geradas (Checkout)
ALTER TABLE quotes ADD COLUMN client_zipcode VARCHAR(20) DEFAULT NULL;
ALTER TABLE quotes ADD COLUMN shipping_cost DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE quotes ADD COLUMN shipping_service VARCHAR(50) DEFAULT NULL;
