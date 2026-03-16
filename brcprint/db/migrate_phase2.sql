-- Phase 2 migration: clients table + quote extensions

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  company VARCHAR(150),
  email VARCHAR(150),
  phone VARCHAR(30),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE quotes ADD COLUMN client_id INT NULL;
ALTER TABLE quotes ADD COLUMN public_token CHAR(36) NULL;
ALTER TABLE quotes ADD COLUMN status ENUM('pending','approved','in_production','delivered','counter_offer','rejected') DEFAULT 'pending';
ALTER TABLE quotes ADD COLUMN counter_offer_price DECIMAL(10,2) NULL;
ALTER TABLE quotes ADD COLUMN counter_offer_notes TEXT NULL;
ALTER TABLE quotes ADD COLUMN responded_at TIMESTAMP NULL;

UPDATE quotes SET public_token = UUID() WHERE public_token IS NULL;

ALTER TABLE quotes ADD CONSTRAINT fk_quote_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
