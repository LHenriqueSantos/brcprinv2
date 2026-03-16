-- Tabela de Planos de Assinatura
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  monthly_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  hours_included DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Atualização da tabela de Clientes para suportar Banco de Horas
ALTER TABLE clients
ADD COLUMN subscription_plan_id INT NULL,
ADD COLUMN available_hours_balance DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'inactive',
ADD CONSTRAINT fk_client_subscription_plan FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL;

-- Tabela de Extrato de Horas
CREATE TABLE IF NOT EXISTS hour_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  quote_id INT NULL,
  type VARCHAR(50) NOT NULL COMMENT 'recharge, deduction, adjustment',
  hours_amount DECIMAL(10, 2) NOT NULL,
  description VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL
);
