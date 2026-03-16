-- Add JSON column for individual part configurations
ALTER TABLE quote_requests ADD COLUMN items JSON DEFAULT NULL;
ALTER TABLE quotes ADD COLUMN items JSON DEFAULT NULL;
