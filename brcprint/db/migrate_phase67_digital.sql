ALTER TABLE `catalog_items`
ADD COLUMN `is_digital_sale` TINYINT(1) DEFAULT 0,
ADD COLUMN `digital_price` DECIMAL(10,2) DEFAULT '0.00';

CREATE TABLE IF NOT EXISTS `digital_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `catalog_item_id` INT NOT NULL,
  `client_name` VARCHAR(150),
  `client_email` VARCHAR(150),
  `price` DECIMAL(10,2) NOT NULL,
  `status` ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
  `pix_code` TEXT,
  `pix_qr` TEXT,
  `download_token` VARCHAR(64) UNIQUE,
  `expires_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`catalog_item_id`) REFERENCES `catalog_items`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
