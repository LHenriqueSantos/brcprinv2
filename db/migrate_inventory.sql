-- Database migration for inventory management

ALTER TABLE filaments
ADD COLUMN stock_g_ml DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN min_stock_warning DECIMAL(10,2) NOT NULL DEFAULT 100.00;

-- Update existing filaments to have some default stock for testing
UPDATE filaments SET stock_g_ml = 1000.00 WHERE stock_g_ml = 0;
