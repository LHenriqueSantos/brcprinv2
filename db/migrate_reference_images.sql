-- Adicionar campo de array JSON para Imagens de Referência (Phase 73)

ALTER TABLE quotes
ADD COLUMN reference_images JSON DEFAULT NULL;

ALTER TABLE quote_requests
ADD COLUMN reference_images JSON DEFAULT NULL;
