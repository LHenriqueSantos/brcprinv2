-- ============================================================
-- BRCPrint – Script de Migração Consolidado v2.0
-- Aplica todas as colunas opcionais que podem estar faltando.
-- Use este script ao atualizar um banco de dados existente.
-- ============================================================

USE brcprint_db;

-- Helper procedure para adicionar coluna apenas se não existir
DROP PROCEDURE IF EXISTS add_col_if_missing;
DELIMITER $$
CREATE PROCEDURE add_col_if_missing(
    IN tbl VARCHAR(64),
    IN col VARCHAR(64),
    IN col_def TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = tbl
          AND COLUMN_NAME = col
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', col_def);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('Coluna adicionada: ', tbl, '.', col) AS log;
    END IF;
END$$
DELIMITER ;

-- ─── BLOCO 1: Status e resposta da cotação ──────────────────
CALL add_col_if_missing('quotes', 'status',           "VARCHAR(50) DEFAULT 'pending'");
CALL add_col_if_missing('quotes', 'responded_at',     'TIMESTAMP NULL DEFAULT NULL');

-- ─── BLOCO 2: Contraproposta do cliente ─────────────────────
CALL add_col_if_missing('quotes', 'counter_offer_price', 'DECIMAL(10,2) DEFAULT NULL');
CALL add_col_if_missing('quotes', 'counter_offer_notes', 'TEXT DEFAULT NULL');

-- ─── BLOCO 3: Frete ─────────────────────────────────────────
CALL add_col_if_missing('quotes', 'shipping_service',   'VARCHAR(100) DEFAULT NULL');
CALL add_col_if_missing('quotes', 'shipping_cost',      'DECIMAL(10,2) DEFAULT 0');

-- ─── BLOCO 4: Validade da cotação ───────────────────────────
CALL add_col_if_missing('quotes', 'valid_days', 'INT NOT NULL DEFAULT 30');

-- ─── BLOCO 5: Cliente vinculado + token público ──────────────
CALL add_col_if_missing('quotes', 'client_id',          'INT DEFAULT NULL');
CALL add_col_if_missing('quotes', 'public_token',       'VARCHAR(36) DEFAULT NULL');
CALL add_col_if_missing('quotes', 'client_name',        'VARCHAR(150) DEFAULT NULL');
CALL add_col_if_missing('quotes', 'client_email',       'VARCHAR(150) DEFAULT NULL');
CALL add_col_if_missing('quotes', 'client_phone',       'VARCHAR(30) DEFAULT NULL');
CALL add_col_if_missing('quotes', 'client_zipcode',     'VARCHAR(20) DEFAULT NULL');
CALL add_col_if_missing('quotes', 'client_address',     'VARCHAR(255) DEFAULT NULL');
CALL add_col_if_missing('quotes', 'client_address_number', 'VARCHAR(20) DEFAULT NULL');
CALL add_col_if_missing('quotes', 'client_address_comp','VARCHAR(100) DEFAULT NULL');
CALL add_col_if_missing('quotes', 'client_neighborhood','VARCHAR(100) DEFAULT NULL');
CALL add_col_if_missing('quotes', 'client_city',        'VARCHAR(100) DEFAULT NULL');
CALL add_col_if_missing('quotes', 'client_state',       'VARCHAR(10) DEFAULT NULL');
CALL add_col_if_missing('quotes', 'client_document',    'VARCHAR(30) DEFAULT NULL');

-- ─── BLOCO 6: Extras, Taxas e Pagamento ─────────────────────
CALL add_col_if_missing('quotes', 'extras',             'JSON DEFAULT NULL');
CALL add_col_if_missing('quotes', 'extras_total',       'DECIMAL(10,2) DEFAULT 0');
CALL add_col_if_missing('quotes', 'discount_value',     'DECIMAL(10,2) DEFAULT 0');
CALL add_col_if_missing('quotes', 'discount_code',      'VARCHAR(100) DEFAULT NULL');
CALL add_col_if_missing('quotes', 'tax_pct_applied',    'DECIMAL(5,2) DEFAULT 0');
CALL add_col_if_missing('quotes', 'tax_amount',         'DECIMAL(10,2) DEFAULT 0');
CALL add_col_if_missing('quotes', 'payment_method',     'VARCHAR(50) DEFAULT NULL');
CALL add_col_if_missing('quotes', 'mp_payment_id',      'BIGINT DEFAULT NULL');
CALL add_col_if_missing('quotes', 'pix_qr_code',        'TEXT DEFAULT NULL');
CALL add_col_if_missing('quotes', 'pix_qr_code_base64', 'TEXT DEFAULT NULL');

-- ─── BLOCO 7: Arquivos e mídia ──────────────────────────────
CALL add_col_if_missing('quotes', 'file_url',            'TEXT DEFAULT NULL');
CALL add_col_if_missing('quotes', 'file_urls',           'JSON DEFAULT NULL');
CALL add_col_if_missing('quotes', 'reference_images',   'JSON DEFAULT NULL');
CALL add_col_if_missing('quotes', 'result_photo_url',   'TEXT DEFAULT NULL');
CALL add_col_if_missing('quotes', 'show_in_showroom',   'TINYINT(1) DEFAULT 0');

-- ─── BLOCO 8: Projeto (Assemblies) ──────────────────────────
CALL add_col_if_missing('quotes', 'project_id', 'INT DEFAULT NULL');

CREATE TABLE IF NOT EXISTS `projects` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `public_token` VARCHAR(36) UNIQUE NOT NULL,
    `client_id` INT NULL,
    `status` ENUM('draft', 'sent', 'approved', 'rejected') DEFAULT 'draft',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ─── BLOCO 9: Snapshot da impressora e custos calculados ─────
CALL add_col_if_missing('quotes', 'printer_power_watts',     'DECIMAL(8,2) DEFAULT 0');
CALL add_col_if_missing('quotes', 'printer_purchase_price',  'DECIMAL(10,2) DEFAULT 0');
CALL add_col_if_missing('quotes', 'printer_lifespan_hours',  'INT DEFAULT 2000');
CALL add_col_if_missing('quotes', 'printer_maintenance_pct', 'DECIMAL(5,2) DEFAULT 5');
CALL add_col_if_missing('quotes', 'filament_cost_per_kg',    'DECIMAL(10,2) DEFAULT 0');

CALL add_col_if_missing('quotes', 'cost_filament',          'DECIMAL(10,2) DEFAULT 0');
CALL add_col_if_missing('quotes', 'cost_energy',            'DECIMAL(10,2) DEFAULT 0');
CALL add_col_if_missing('quotes', 'cost_depreciation',      'DECIMAL(10,2) DEFAULT 0');
CALL add_col_if_missing('quotes', 'cost_maintenance',       'DECIMAL(10,2) DEFAULT 0');
CALL add_col_if_missing('quotes', 'cost_labor',             'DECIMAL(10,2) DEFAULT 0');
CALL add_col_if_missing('quotes', 'cost_losses',            'DECIMAL(10,2) DEFAULT 0');
CALL add_col_if_missing('quotes', 'cost_spare_parts',       'DECIMAL(10,2) DEFAULT 0');
CALL add_col_if_missing('quotes', 'cost_total_production',  'DECIMAL(10,2) DEFAULT 0');
CALL add_col_if_missing('quotes', 'profit_value',           'DECIMAL(10,2) DEFAULT 0');
CALL add_col_if_missing('quotes', 'final_price',            'DECIMAL(10,2) DEFAULT 0');
CALL add_col_if_missing('quotes', 'final_price_per_unit',   'DECIMAL(10,2) DEFAULT 0');

-- ─── Limpeza ─────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS add_col_if_missing;

SELECT 'Migracao BRCPrint v2.0 concluida com sucesso!' AS resultado;
