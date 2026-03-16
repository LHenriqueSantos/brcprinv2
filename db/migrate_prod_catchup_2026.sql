-- ============================================================
-- BRCPrint – Script de Sincronização de Produção (Mar/2026)
-- Garante que todas as tabelas e colunas recentes existam.
-- ============================================================

USE brcprint_db;

-- 1. Helper procedure para adicionar colunas com segurança
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

-- 2. Tabela de Modelos Paramétricos (Novo Recurso)
CREATE TABLE IF NOT EXISTS parametric_models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  image_url VARCHAR(500),
  scad_file_url VARCHAR(500) NOT NULL,
  parameters_schema JSON NOT NULL,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  filament_id INT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (filament_id) REFERENCES filaments(id) ON DELETE SET NULL
);

-- 3. Tabela de Upsells (Adicionais de Pós-Processamento)
CREATE TABLE IF NOT EXISTS upsell_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    charge_type ENUM('fixed', 'labor_hours') NOT NULL DEFAULT 'fixed',
    charge_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    per_unit BOOLEAN NOT NULL DEFAULT 1,
    active BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserindo Upsells padrão se a tabela estiver vazia
INSERT INTO upsell_options (name, description, charge_type, charge_value, per_unit)
SELECT 'Pintura Primer Cinza', 'Aplicação de fundo preparador.', 'fixed', 15.00, 1
WHERE NOT EXISTS (SELECT 1 FROM upsell_options WHERE name = 'Pintura Primer Cinza');

-- 4. Ajustes em Quotes e Quote Requests (Colunas Faltantes)
CALL brc_add_col('quotes', 'reference_images', 'JSON DEFAULT NULL');
CALL brc_add_col('quote_requests', 'reference_images', 'JSON DEFAULT NULL');
CALL brc_add_col('quote_requests', 'request_type', "ENUM('stl','manual') NOT NULL DEFAULT 'stl'");
CALL brc_add_col('quotes', 'request_type', "ENUM('stl','manual') NOT NULL DEFAULT 'stl'");
CALL brc_add_col('quotes', 'nfe_status', 'VARCHAR(50) NULL');
CALL brc_add_col('quotes', 'nfe_url', 'VARCHAR(500) NULL');

-- 5. Tabelas para o Leilão de Centavos
CREATE TABLE IF NOT EXISTS auction_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  retail_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  current_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  end_time DATETIME NOT NULL,
  status ENUM('pending', 'active', 'finished', 'cancelled') NOT NULL DEFAULT 'pending',
  winner_id INT NULL,
  time_increment INT NOT NULL DEFAULT 15,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (winner_id) REFERENCES clients(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS bids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  auction_id INT NOT NULL,
  client_id INT NOT NULL,
  price_after_bid DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auction_items(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS client_bids_balance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL UNIQUE,
  balance INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bid_packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bids_amount INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Popula pacotes padrão para os Leilões de Centavos
INSERT INTO bid_packages (name, bids_amount, price)
SELECT 'Pacote Iniciante', 20, 10.00
WHERE NOT EXISTS (SELECT 1 FROM bid_packages WHERE name = 'Pacote Iniciante');

INSERT INTO bid_packages (name, bids_amount, price)
SELECT 'Pacote Prata', 50, 22.50
WHERE NOT EXISTS (SELECT 1 FROM bid_packages WHERE name = 'Pacote Prata');

INSERT INTO bid_packages (name, bids_amount, price)
SELECT 'Pacote Ouro', 120, 50.00
WHERE NOT EXISTS (SELECT 1 FROM bid_packages WHERE name = 'Pacote Ouro');

-- 6. Limpeza
DROP PROCEDURE IF EXISTS brc_add_col;

SELECT 'Sincronização de Produção finalizada com sucesso!' AS status;
