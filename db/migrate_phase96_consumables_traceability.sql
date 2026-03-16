-- Migration: Phase 96 - Consumables Traceability
-- Adds Lot Number, Roll Number, and Purchase Date to the consumables table.

ALTER TABLE consumables
ADD COLUMN lot_number VARCHAR(100) AFTER unit_type,
ADD COLUMN roll_number VARCHAR(100) AFTER lot_number,
ADD COLUMN purchase_date DATE AFTER roll_number;
