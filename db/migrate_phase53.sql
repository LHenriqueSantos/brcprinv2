-- Phase 53: Adição de Agendamento/Timeline
ALTER TABLE quotes ADD COLUMN scheduled_start DATETIME DEFAULT NULL;
ALTER TABLE quotes ADD COLUMN scheduled_end DATETIME DEFAULT NULL;
