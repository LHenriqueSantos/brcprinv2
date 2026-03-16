-- Migration: Add G-code and Auto-Print capabilities to Catalog Items
-- Description: Supports the "Zero-Click" slicer automation pipeline.

ALTER TABLE `catalog_items`
ADD COLUMN `gcode_url` VARCHAR(500) NULL AFTER `stl_file_url`,
ADD COLUMN `auto_print_enabled` BOOLEAN DEFAULT FALSE AFTER `gcode_url`,
ADD COLUMN `target_printer_id` INT NULL AFTER `auto_print_enabled`,
ADD CONSTRAINT `fk_catalog_items_printer`
    FOREIGN KEY (`target_printer_id`)
    REFERENCES `printers` (`id`)
    ON DELETE SET NULL;
