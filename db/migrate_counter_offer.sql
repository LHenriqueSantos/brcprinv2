-- Add missing columns required for counter-offer and shipping features
-- Each ALTER TABLE is separate to gracefully handle if some already exist

ALTER TABLE `quotes` ADD COLUMN `counter_offer_price` DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE `quotes` ADD COLUMN `shipping_service` VARCHAR(100) DEFAULT NULL;
ALTER TABLE `quotes` ADD COLUMN `shipping_cost` DECIMAL(10,2) DEFAULT 0;
