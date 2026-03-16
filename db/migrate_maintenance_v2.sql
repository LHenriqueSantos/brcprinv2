-- Rastreamento avançado de consumíveis em manutenção preventiva
-- Phase 86

-- 1. Garantir que last_maintenance_hours existe (pode já existir se migrações parciais rodaram)
-- Em SQL puro, usamos PROCEDURE ou ignoramos erro se já existir, mas aqui vou usar ALTER TABLE IGNORE se possível ou apenas ALTER.
-- Nota: O MySQL costuma dar erro se a coluna existe. Vou tentar adicionar e o sistema de migração lida.

-- 1. Tentar adicionar coluna. Se já existir, o comando falhará, o que ignoraremos se rodar via script manual ou trataremos.
ALTER TABLE printers ADD COLUMN last_maintenance_hours FLOAT DEFAULT 0;

-- 2. Criar tabela de junção para consumíveis usados na manutenção
CREATE TABLE IF NOT EXISTS `maintenance_consumables` (
  `id` int NOT NULL AUTO_INCREMENT,
  `maintenance_log_id` int NOT NULL,
  `consumable_id` int NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_cost` decimal(10,2) NOT NULL COMMENT 'Custo unitário no momento da manutenção',
  PRIMARY KEY (`id`),
  KEY `maintenance_log_id` (`maintenance_log_id`),
  KEY `consumable_id` (`consumable_id`),
  CONSTRAINT `fk_maint_log` FOREIGN KEY (`maintenance_log_id`) REFERENCES `printer_maintenance_logs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_maint_consumable` FOREIGN KEY (`consumable_id`) REFERENCES `consumables` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
