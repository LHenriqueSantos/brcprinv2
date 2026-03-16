-- ------------------------------------------------------------
-- Modelos Paramétricos (OpenSCAD Catalog)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parametric_models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  image_url VARCHAR(500),
  scad_file_url VARCHAR(500) NOT NULL,
  parameters_schema JSON NOT NULL, -- The extracted input fields schema
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  filament_id INT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (filament_id) REFERENCES filaments(id) ON DELETE SET NULL
);

-- Note: No need for quotes connection yet. The generated STL will be
-- injected as a standard quote in quote_requests just like any generic file.
