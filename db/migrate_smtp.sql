-- Adicionar campos SMTP em business_config
ALTER TABLE business_config ADD COLUMN smtp_host VARCHAR(255) NULL;
ALTER TABLE business_config ADD COLUMN smtp_port INT NULL;
ALTER TABLE business_config ADD COLUMN smtp_user VARCHAR(255) NULL;
ALTER TABLE business_config ADD COLUMN smtp_pass VARCHAR(255) NULL;
ALTER TABLE business_config ADD COLUMN sender_email VARCHAR(255) NULL;
