-- Migration: Phase 95 - Filament Traceability
-- Adds Lot Number, Roll Number, and Purchase Date for better material tracking.

ALTER TABLE filaments
ADD COLUMN lot_number VARCHAR(100) AFTER color,
ADD COLUMN roll_number VARCHAR(100) AFTER lot_number,
ADD COLUMN purchase_date DATE AFTER roll_number;
