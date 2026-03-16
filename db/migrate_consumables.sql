-- Migration for Consumables Inventory System
-- Defines consumables and their usage in quotes

CREATE TABLE IF NOT EXISTS consumables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL, -- Ex: 'Tinta', 'Cola', 'Lixa', 'Geral', 'Embalagem'
  unit_type VARCHAR(20) NOT NULL, -- Ex: 'ml', 'un', 'g', 'folha', 'cm'
  cost_per_unit DECIMAL(10,2) NOT NULL,
  stock_current DECIMAL(10,2) DEFAULT 0,
  stock_min_warning DECIMAL(10,2) DEFAULT 0,
  total_purchased DECIMAL(10,2) DEFAULT 0,
  active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quote_consumables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote_id INT NOT NULL,
  consumable_id INT NOT NULL,
  quantity_used DECIMAL(10,2) NOT NULL,
  cost_recorded DECIMAL(10,2) NOT NULL, -- Total cost for this usage (quantity * cost_per_unit at the time)
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (consumable_id) REFERENCES consumables(id) ON DELETE RESTRICT
);

-- Insert some default consumables to get started
INSERT INTO consumables (name, category, unit_type, cost_per_unit, stock_current, stock_min_warning) VALUES
('Super Bonder Flex', 'Cola', 'un', 15.00, 5, 2),
('Tinta Acrílica Preta', 'Tinta', 'ml', 0.50, 200, 50),
('Tinta Acrílica Branca', 'Tinta', 'ml', 0.50, 200, 50),
('Lixa D''água 400', 'Lixa', 'folha', 2.50, 20, 5),
('Primer Spray', 'Tinta', 'un', 35.00, 3, 1),
('Caixa de Papelão 20x20x15', 'Embalagem', 'un', 3.50, 50, 10),
('Plástico Bolha', 'Embalagem', 'cm', 0.05, 5000, 1000)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
