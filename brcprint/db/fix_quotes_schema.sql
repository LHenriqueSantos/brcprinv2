-- Migration script to add missing columns safely
ALTER TABLE quotes
ADD COLUMN file_url TEXT,
ADD COLUMN file_urls JSON,
ADD COLUMN extras JSON,
ADD COLUMN extras_total DECIMAL(10,2) DEFAULT 0.00;
