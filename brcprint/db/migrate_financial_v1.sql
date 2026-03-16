-- Expansão do módulo financeiro para suporte a DRE
-- Phase 87

-- 1. Categorização de custos (Fixo vs Variável) e rastreio de data de pagamento real
ALTER TABLE expenses ADD COLUMN type ENUM('fixed', 'variable') DEFAULT 'fixed';
ALTER TABLE expenses ADD COLUMN payment_date DATE DEFAULT NULL;

-- 2. Atualizar despesas existentes marcadas como 'paid' para ter uma data de pagamento (fallback para due_date)
UPDATE expenses SET payment_date = due_date WHERE status = 'paid' AND payment_date IS NULL;
