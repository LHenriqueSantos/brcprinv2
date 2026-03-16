-- Migration: Phase 97 - Filament Lots Traceability Fix
-- Adds Roll Number and Purchase Date to individual filament lots.

ALTER TABLE filament_lots
ADD COLUMN roll_number VARCHAR(100) AFTER lot_number,
ADD COLUMN purchase_date DATE AFTER roll_number;
