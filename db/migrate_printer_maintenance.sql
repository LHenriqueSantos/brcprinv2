-- Adicionar colunas para rastreamento de manutenção em impressoras
ALTER TABLE printers ADD COLUMN current_hours_printed FLOAT DEFAULT 0;
ALTER TABLE printers ADD COLUMN maintenance_alert_threshold INT DEFAULT 200; -- 200 horas recomendadas (ex: engraxar eixos)
