-- db/migrate_nesting.sql

-- 1. Create table `platters`
CREATE TABLE IF NOT EXISTS `platters` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `printer_id` INT DEFAULT NULL,
    `status` ENUM('pending', 'in_production', 'delivered') DEFAULT 'pending',
    `start_time` DATETIME DEFAULT NULL,
    `end_time` DATETIME DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`printer_id`) REFERENCES `printers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Add `platter_id` to `quotes` table
-- Note: Make sure not to execute this multiple times if the column already exists.
-- A safe way in MySQL 8 is to check information_schema, but for simplicity in this migration:
ALTER TABLE `quotes`
ADD COLUMN `platter_id` INT DEFAULT NULL;

-- 3. Add Foreign Key for `platter_id` in `quotes` table
ALTER TABLE `quotes`
ADD CONSTRAINT `fk_quotes_platter`
FOREIGN KEY (`platter_id`) REFERENCES `platters`(`id`) ON DELETE SET NULL;
