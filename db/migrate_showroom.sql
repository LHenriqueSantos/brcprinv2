-- db/migrate_showroom.sql

-- Add `show_in_showroom` to `quotes` table
ALTER TABLE `quotes`
ADD COLUMN `show_in_showroom` BOOLEAN DEFAULT 0;
