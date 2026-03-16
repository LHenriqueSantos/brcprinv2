-- Migration for BOM (Bill of Materials) Module
CREATE TABLE IF NOT EXISTS quote_bom (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id INT NOT NULL,
    consumable_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (consumable_id) REFERENCES consumables(id) ON DELETE CASCADE
);
