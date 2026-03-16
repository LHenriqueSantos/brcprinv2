-- Phase 65: Suporte a Impressão Multi-color (AMS/MMU)

-- Adicionar configurações de AMS na tabela global
ALTER TABLE business_config
  ADD COLUMN enable_multicolor TINYINT(1) DEFAULT 0 COMMENT 'Habilita opção Multi-color via AMS no portal',
  ADD COLUMN multicolor_markup_pct DECIMAL(5,2) DEFAULT 15.00 COMMENT '% de markup extra pelo risco/complexidade',
  ADD COLUMN multicolor_waste_g DECIMAL(8,2) DEFAULT 50.00 COMMENT 'Peso médio (g) da Torre de Purga (Wipe Tower)',
  ADD COLUMN multicolor_hours_added DECIMAL(8,2) DEFAULT 1.50 COMMENT 'Tempo extra (h) médio de trocas de filamento';

-- Adicionar flag na tabela de cotações para rastrear pedidos coloridos
ALTER TABLE quotes
  ADD COLUMN is_multicolor TINYINT(1) DEFAULT 0 COMMENT 'Indica se o cliente solicitou impressão Multi-colorida';
