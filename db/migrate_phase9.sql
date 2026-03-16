-- Phase 9 migration: Filament Physical Inventory

-- Add physical weight tracking to filaments
ALTER TABLE filaments ADD COLUMN initial_weight_g DECIMAL(10,2) NOT NULL DEFAULT 1000;
ALTER TABLE filaments ADD COLUMN current_weight_g DECIMAL(10,2) NOT NULL DEFAULT 1000;

-- Tracking column to prevent double-deducting filament from quotes
ALTER TABLE quotes ADD COLUMN filament_deducted BOOLEAN NOT NULL DEFAULT FALSE;
