-- ------------------------------------------------------------
-- Tabela de Lotes de Filamento (Rolos Individuais)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS filament_lots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filament_id INT NOT NULL,
  lot_number VARCHAR(100) NOT NULL,
  initial_weight_g DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
  current_weight_g DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
  cost_per_kg DECIMAL(10,2) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (filament_id) REFERENCES filaments(id)
);

-- ------------------------------------------------------------
-- Vincular cotação a um lote específico na produção
-- ------------------------------------------------------------
ALTER TABLE quotes ADD COLUMN filament_lot_id INT NULL;
ALTER TABLE quotes ADD FOREIGN KEY (filament_lot_id) REFERENCES filament_lots(id);
