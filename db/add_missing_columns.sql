-- Migration: Add missing columns to existing tables (safe, idempotent via stored procedure)
USE brcprint_db;

DROP PROCEDURE IF EXISTS add_column_if_not_exists;

DELIMITER //
CREATE PROCEDURE add_column_if_not_exists(
    tbl_name VARCHAR(64),
    col_name VARCHAR(64),
    col_def TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = tbl_name
          AND COLUMN_NAME = col_name
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', tbl_name, '` ADD COLUMN `', col_name, '` ', col_def);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- clients
CALL add_column_if_not_exists('clients', 'auth_provider', 'VARCHAR(50) DEFAULT NULL');
CALL add_column_if_not_exists('clients', 'auth_provider_id', 'VARCHAR(255) DEFAULT NULL');
CALL add_column_if_not_exists('clients', 'credit_balance', 'DECIMAL(10,2) DEFAULT 0');
CALL add_column_if_not_exists('clients', 'available_hours_balance', 'DECIMAL(8,2) DEFAULT 0');
CALL add_column_if_not_exists('clients', 'available_grams_balance', 'DECIMAL(10,2) DEFAULT 0');

-- quotes
CALL add_column_if_not_exists('quotes', 'is_paid', 'TINYINT(1) DEFAULT 0');
CALL add_column_if_not_exists('quotes', 'paid_at', 'TIMESTAMP NULL');
CALL add_column_if_not_exists('quotes', 'show_in_showroom', 'TINYINT(1) DEFAULT 0');
CALL add_column_if_not_exists('quotes', 'credits_used', 'DECIMAL(10,2) DEFAULT 0');
CALL add_column_if_not_exists('quotes', 'gcode_url', 'VARCHAR(500) DEFAULT NULL');
CALL add_column_if_not_exists('quotes', 'platter_id', 'INT NULL');
CALL add_column_if_not_exists('quotes', 'project_id', 'INT NULL');
CALL add_column_if_not_exists('quotes', 'filament_lot_id', 'INT NULL');
CALL add_column_if_not_exists('quotes', 'scheduled_start', 'DATETIME DEFAULT NULL');
CALL add_column_if_not_exists('quotes', 'scheduled_end', 'DATETIME DEFAULT NULL');

-- filament_lots
CALL add_column_if_not_exists('filament_lots', 'roll_number', 'VARCHAR(100) DEFAULT NULL');
CALL add_column_if_not_exists('filament_lots', 'purchase_date', 'DATE DEFAULT NULL');

-- filaments
CALL add_column_if_not_exists('filaments', 'lot_number', 'VARCHAR(100) DEFAULT NULL');
CALL add_column_if_not_exists('filaments', 'roll_number', 'VARCHAR(100) DEFAULT NULL');
CALL add_column_if_not_exists('filaments', 'purchase_date', 'DATE DEFAULT NULL');
CALL add_column_if_not_exists('filaments', 'initial_weight_g', 'DECIMAL(10,2) DEFAULT 1000.00');
CALL add_column_if_not_exists('filaments', 'current_weight_g', 'DECIMAL(10,2) DEFAULT 1000.00');
CALL add_column_if_not_exists('filaments', 'min_stock_warning', 'DECIMAL(10,2) DEFAULT 100.00');
CALL add_column_if_not_exists('filaments', 'total_purchased_g', 'DECIMAL(10,2) DEFAULT 1000.00');

DROP PROCEDURE IF EXISTS add_column_if_not_exists;
