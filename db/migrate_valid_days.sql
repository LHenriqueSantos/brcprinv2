-- db/migrate_valid_days.sql

ALTER TABLE `quotes`
ADD COLUMN `valid_days` INT NOT NULL DEFAULT 30;
