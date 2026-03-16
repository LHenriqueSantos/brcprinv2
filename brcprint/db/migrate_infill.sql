-- Add Infill Percentage Column
ALTER TABLE quote_requests ADD COLUMN infill_percentage INT DEFAULT 20;
ALTER TABLE quotes ADD COLUMN infill_percentage INT DEFAULT 20;
