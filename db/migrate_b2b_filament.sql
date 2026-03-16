-- Expansão do Módulo B2B: Suporte a Gramas e Custo Fixo de Filamento

-- 1. Atualizar Tabela de Planos
ALTER TABLE subscription_plans
ADD COLUMN filament_type VARCHAR(50) NULL AFTER name,
ADD COLUMN b2b_filament_cost DECIMAL(10, 2) NULL AFTER monthly_price,
ADD COLUMN grams_included DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER hours_included;

-- 2. Atualizar Tabela de Clientes
ALTER TABLE clients
ADD COLUMN available_grams_balance DECIMAL(10, 2) DEFAULT 0.00 AFTER available_hours_balance;

-- 3. Atualizar Tabela de Extrato
ALTER TABLE hour_transactions
ADD COLUMN grams_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER hours_amount;
