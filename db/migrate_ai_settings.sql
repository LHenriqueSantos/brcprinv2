-- Migration: Add AI Chat settings to business_config

DROP PROCEDURE IF EXISTS brc_add_col;
DELIMITER $$
CREATE PROCEDURE brc_add_col(IN tbl VARCHAR(64), IN col VARCHAR(64), IN col_def TEXT)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col) THEN
    SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', col_def);
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

CALL brc_add_col('business_config', 'ai_system_prompt', 'TEXT NULL');
CALL brc_add_col('business_config', 'ai_welcome_message', 'TEXT NULL');

DROP PROCEDURE IF EXISTS brc_add_col;
