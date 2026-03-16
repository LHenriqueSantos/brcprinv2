-- Phase 14: Sistema de Mensagens/Chat por Orçamento

CREATE TABLE IF NOT EXISTS quote_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote_id INT NOT NULL,
  sender_type ENUM('admin', 'client') NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);
