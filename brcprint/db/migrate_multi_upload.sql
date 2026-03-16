-- Upgrade table columns for multi-STL upload
ALTER TABLE quote_requests ADD COLUMN file_urls JSON;
ALTER TABLE quotes ADD COLUMN file_urls JSON;

-- Initialize older single uploads as JSON arrays safely
UPDATE quote_requests SET file_urls = JSON_ARRAY(file_url) WHERE file_urls IS NULL;
UPDATE quotes SET file_urls = JSON_ARRAY(file_url) WHERE file_urls IS NULL;
