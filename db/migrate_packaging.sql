-- Nova tabela para Múltiplos Tamanhos de Embalagem (Phase 71)

CREATE TABLE IF NOT EXISTS packaging_sizes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  length_cm DECIMAL(6,2) NOT NULL,
  width_cm DECIMAL(6,2) NOT NULL,
  height_cm DECIMAL(6,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  max_weight_kg DECIMAL(6,2) DEFAULT 30.00,
  active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir tamanhos padrão do correio
INSERT INTO packaging_sizes (name, length_cm, width_cm, height_cm, cost, max_weight_kg)
VALUES
('Caixa P (Correios)', 16.00, 11.00, 3.00, 2.50, 1.00),
('Caixa M (Correios)', 24.00, 16.00, 9.00, 4.00, 5.00),
('Caixa G (Correios)', 36.00, 27.00, 18.00, 8.00, 10.00)
ON DUPLICATE KEY UPDATE id=id;
