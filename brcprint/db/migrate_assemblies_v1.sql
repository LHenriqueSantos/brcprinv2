-- db/migrate_assemblies_v1.sql

-- 1. Create table `projects`
CREATE TABLE IF NOT EXISTS `projects` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `public_token` VARCHAR(36) UNIQUE NOT NULL,
    `client_id` INT NULL,
    `status` ENUM('draft', 'sent', 'approved', 'rejected') DEFAULT 'draft',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Add `project_id` to `quotes` table
ALTER TABLE `quotes`
ADD COLUMN `project_id` INT DEFAULT NULL;

-- 3. Add Foreign Key for `project_id` in `quotes` table
ALTER TABLE `quotes`
ADD CONSTRAINT `fk_quotes_project`
FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL;
