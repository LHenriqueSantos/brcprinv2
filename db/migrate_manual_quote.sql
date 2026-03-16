-- Migration: Manual Quote (Photo/Description) Feature
-- MySQL 8 compatible: uses stored procedure to add columns only if they don't exist

DROP PROCEDURE IF EXISTS brc_add_col;

DELIMITER $$
CREATE PROCEDURE brc_add_col(
  IN tbl VARCHAR(64),
  IN col VARCHAR(64),
  IN col_def TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', col_def);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

CALL brc_add_col('quote_requests', 'request_type', "ENUM('stl','manual') NOT NULL DEFAULT 'stl'");
CALL brc_add_col('quote_requests', 'reference_photos', 'JSON NULL');
CALL brc_add_col('quote_requests', 'manual_description', 'TEXT NULL');

CALL brc_add_col('quotes', 'request_type', "ENUM('stl','manual') NOT NULL DEFAULT 'stl'");
CALL brc_add_col('quotes', 'nfe_status', 'VARCHAR(50) NULL');
CALL brc_add_col('quotes', 'nfe_url', 'VARCHAR(500) NULL');
CALL brc_add_col('quotes', 'melhorenvio_order_id', 'VARCHAR(100) NULL');

DROP PROCEDURE IF EXISTS brc_add_col;
