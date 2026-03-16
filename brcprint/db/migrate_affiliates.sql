-- Migration for Affiliate System (Phase 41)

-- 1. Create Affiliates Table
CREATE TABLE IF NOT EXISTS affiliates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  referral_code VARCHAR(100) NOT NULL UNIQUE,
  commission_rate_pct DECIMAL(5,2) DEFAULT 0,
  pix_key VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add referred_by to clients
ALTER TABLE clients
ADD COLUMN referred_by INT DEFAULT NULL,
ADD FOREIGN KEY (referred_by) REFERENCES affiliates(id) ON DELETE SET NULL;

-- 3. Create Commissions Table
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  affiliate_id INT NOT NULL,
  quote_id INT NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'available', 'paid', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);
