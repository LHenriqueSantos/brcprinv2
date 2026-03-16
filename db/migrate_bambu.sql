-- Bambu Lab Integration: Add device_serial column + update api_type ENUM
-- Run this migration once to support Bambu Lab printers in the system.

ALTER TABLE printers
  MODIFY COLUMN api_type ENUM('octoprint', 'moonraker', 'bambu', 'none') DEFAULT 'none';

ALTER TABLE printers
  ADD COLUMN IF NOT EXISTS device_serial VARCHAR(64) DEFAULT NULL
    COMMENT 'Bambu Lab Serial Number (found in Settings → Device Information)';
