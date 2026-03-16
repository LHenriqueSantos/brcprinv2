-- Phase 25: Adicionais de Pós-Processamento (Upsells)

CREATE TABLE IF NOT EXISTS upsell_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    charge_type ENUM('fixed', 'labor_hours') NOT NULL DEFAULT 'fixed',
    charge_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    per_unit BOOLEAN NOT NULL DEFAULT 1 COMMENT 'If true, charge multiplies by quantity of parts',
    active BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserindo alguns serviços de exemplo de fábrica
INSERT INTO upsell_options (name, description, charge_type, charge_value, per_unit, active) VALUES
('Pintura Primer Cinza', 'Aplicação de fundo preparador para receber pintura final.', 'fixed', 15.00, 1, 1),
('Lixamento e Acabamento Suave', 'Remoção manual das linhas de camada (layer lines) para um aspecto mais liso.', 'labor_hours', 1.00, 1, 1),
('Banho de Vapor de Acetona (Apenas ABS)', 'Alisa quimicamente a peça, dando aspecto "Glass".', 'fixed', 45.00, 1, 1),
('Embalagem para Presente Premium', 'Caixa rígida BRCPrint com fita cetim.', 'fixed', 25.00, 0, 1);
