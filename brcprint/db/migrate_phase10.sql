-- Phase 10: Web-to-Print Client Portal

-- Add password authentication column to clients
ALTER TABLE clients ADD COLUMN password_hash VARCHAR(255) NULL;

-- Create quote requests storage
CREATE TABLE IF NOT EXISTS quote_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  file_url VARCHAR(500) NOT NULL COMMENT 'Caminho do STL salvo',
  material_preference VARCHAR(100),
  color_preference VARCHAR(100),
  quantity INT NOT NULL DEFAULT 1,
  notes TEXT,
  status ENUM('pending', 'quoted', 'rejected') DEFAULT 'pending',
  quote_id INT NULL COMMENT 'Link para a cotação gerada',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL
);
