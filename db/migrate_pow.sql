-- Migration to add result_photo_url for Proof of Work feature
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS result_photo_url TEXT AFTER file_urls;
