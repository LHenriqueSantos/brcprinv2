-- Migration: Phase 94 - Add total_purchased_g to filaments
-- This column tracks the total amount of filament initially purchased (e.g., 1000g)
-- for better consumption tracking and ROI calculations.

ALTER TABLE filaments
ADD COLUMN total_purchased_g decimal(10,2) NOT NULL DEFAULT '1000.00'
AFTER min_stock_warning;

-- Set initial values to match initial_weight_g for existing records
UPDATE filaments SET total_purchased_g = initial_weight_g;
