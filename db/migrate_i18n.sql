-- Migration Phase 35: i18n and Multi-Currency
ALTER TABLE business_config
ADD COLUMN currency_code VARCHAR(10) DEFAULT 'BRL',
ADD COLUMN currency_symbol VARCHAR(10) DEFAULT 'R$',
ADD COLUMN language_default VARCHAR(10) DEFAULT 'pt';
