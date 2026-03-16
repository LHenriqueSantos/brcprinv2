-- Adiciona colunas para identificar provedores de autenticação social
ALTER TABLE clients
ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'credentials',
ADD COLUMN auth_provider_id VARCHAR(255) DEFAULT NULL;

-- As senhas já podiam ser NULL, mas se não fossem, garantiríamos aqui:
-- ALTER TABLE clients MODIFY password_hash VARCHAR(255) NULL;
