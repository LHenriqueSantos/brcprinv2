-- Migration for Energy Tariff Optimization
ALTER TABLE business_config
ADD COLUMN energy_flag ENUM('green', 'yellow', 'red1', 'red2') DEFAULT 'green',
ADD COLUMN energy_peak_price DECIMAL(10,4) DEFAULT 0.0000,
ADD COLUMN energy_off_peak_price DECIMAL(10,4) DEFAULT 0.0000,
ADD COLUMN energy_peak_start TIME DEFAULT '18:00:00',
ADD COLUMN energy_peak_end TIME DEFAULT '21:00:00';

-- Initialize values with existing energy_kwh_price if available
UPDATE business_config
SET energy_off_peak_price = energy_kwh_price,
    energy_peak_price = IF(energy_kwh_price > 0, energy_kwh_price * 1.5, 0.0000)
WHERE id = 1;
