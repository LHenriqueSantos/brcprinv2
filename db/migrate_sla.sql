-- Add ENUM column to differentiate technology
ALTER TABLE printers ADD COLUMN type ENUM('FDM', 'SLA') DEFAULT 'FDM' AFTER model;

-- Optional: Insert a sample SLA printer if wanted
INSERT INTO printers (name, model, type, power_watts, purchase_price, lifespan_hours, maintenance_reserve_pct)
VALUES ('Elegoo Saturn 3', 'Elegoo Saturn 3 Ultra', 'SLA', 80.00, 2500.00, 2000, 5.00);

-- Insert sample Resins (Treat as filament since 1kg = 1L roughly for cost scaling)
INSERT INTO filaments (name, brand, type, color, cost_per_kg, density_g_cm3)
VALUES
('Resina Standard', 'Elegoo', 'SLA_RESIN', 'Cinza', 150.00, 1.1000),
('Resina ABS-Like', 'Anycubic', 'SLA_RESIN', 'Branco', 190.00, 1.1200),
('Resina Lavável em Água', 'Creality', 'SLA_RESIN', 'Preto', 160.00, 1.0500);
