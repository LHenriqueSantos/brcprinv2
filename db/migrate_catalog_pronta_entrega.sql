-- Adição de campos para Catálogo (Gestão de Estoque Pronta Entrega e Múltiplas Fotos)
ALTER TABLE catalog_items
ADD COLUMN image_urls JSON DEFAULT NULL AFTER image_url,
ADD COLUMN is_ready_to_ship TINYINT(1) DEFAULT 0 AFTER stl_file_url,
ADD COLUMN ready_stock_details JSON DEFAULT NULL AFTER is_ready_to_ship,
ADD COLUMN allow_custom_order TINYINT(1) DEFAULT 1 AFTER ready_stock_details;
