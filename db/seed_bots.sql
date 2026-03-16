-- ============================================================
-- SEED: 3000 Usuários Bot para Testes do Sistema de Leilão
-- Ambiente: LOCAL / DOCKER apenas
-- NÃO executar em produção
-- ============================================================

-- Limpar bots anteriores (opcional - comentar se quiser preservar)
-- DELETE FROM client_bids_balance WHERE client_id IN (SELECT id FROM clients WHERE email LIKE '%@bot.brcprint.com');
-- DELETE FROM clients WHERE email LIKE '%@bot.brcprint.com';

-- ============================================================
-- Tabela temporária com nomes e sobrenomes brasileiros
-- ============================================================
DROP TEMPORARY TABLE IF EXISTS bot_names;
CREATE TEMPORARY TABLE bot_names (
  primeiro VARCHAR(50),
  sobrenome VARCHAR(50)
);

INSERT INTO bot_names (primeiro, sobrenome) VALUES
('Ana','Silva'),('Bruno','Santos'),('Carlos','Oliveira'),('Daniela','Souza'),('Eduardo','Lima'),
('Fernanda','Pereira'),('Gabriel','Alves'),('Helena','Costa'),('Igor','Ferreira'),('Juliana','Rodrigues'),
('Kevin','Martins'),('Larissa','Gomes'),('Marcos','Ribeiro'),('Natalia','Carvalho'),('Otávio','Araujo'),
('Patricia','Nascimento'),('Rafael','Melo'),('Sandra','Barbosa'),('Thiago','Xavier'),('Ursula','Moreira'),
('Victor','Cardoso'),('Wanessa','Correia'),('Xandre','Teixeira'),('Yasmin','Dias'),('Zuleika','Nunes'),
('Alexandre','Batista'),('Beatriz','Moraes'),('Caio','Lopes'),('Diana','Vieira'),('Enzo','Monteiro'),
('Flavia','Machado'),('Gustavo','Cavalcante'),('Heloisa','Medeiros'),('Ivan','Cunha'),('Joana','Neto'),
('Kaique','Rocha'),('Luana','Andrade'),('Mateus','Farias'),('Nina','Braga'),('Oscar','Freitas'),
('Priscila','Vasconcelos'),('Rodrigo','Barros'),('Sabrina','Siqueira'),('Tiago','Cruz'),('Ubiratan','Pimentel'),
('Vanessa','Azevedo'),('Wesley','Campos'),('Ximena','Borges'),('Yago','Porto'),('Zara','Mendes'),
('Adriana','Guimarães'),('Bernardo','Fonseca'),('Claudia','Torres'),('Davi','Rezende'),('Elaine','Queiroz'),
('Felipe','Coelho'),('Giovanna','Luz'),('Henrique','Ramos'),('Iris','Pinto'),('Jonas','Souza'),
('Karina','Sampaio'),('Leonardo','Mesquita'),('Mariana','Brito'),('Nicolas','Lacerda'),('Olivia','Viana'),
('Paulo','Duarte'),('Renata','Coutinho'),('Sergio','Magalhães'),('Tatiana','Castro'),('Ulisses','Nogueira'),
('Valentina','Freire'),('William','Leite'),('Xica','Pacheco'),('Yara','Pessoa'),('Zeno','Rolim'),
('Amanda','Siqueira'),('Bogdan','Oliveira'),('Camila','Fonseca'),('Diego','Albuquerque'),('Evelyn','Abreu'),
('Fabio','Couto'),('Grace','Bentes'),('Humberto','Assis'),('Inês','Salles'),('Jeferson','Paiva'),
('Katia','Leal'),('Lucas','Macedo'),('Mirela','Aragão'),('Nelson','Cavalcanti'),('Odete','Prado'),
('Pamela','Figueiredo'),('Quirino','Bastos'),('Roberta','Ferraz'),('Samuel','Patriota'),('Tamara','Mesquita'),
('Umberto','Caldas'),('Veronica','Serrano'),('Wander','Benício'),('Xisto','Leão'),('Yolanda','Barreto'),
('Zelma','Roque');

-- ============================================================
-- Procedure para inserir 3000 bots com nomes aleatórios
-- ============================================================
DROP PROCEDURE IF EXISTS seed_bots;

DELIMITER $$

CREATE PROCEDURE seed_bots()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE total_names INT;
  DECLARE idx_p INT;
  DECLARE idx_s INT;
  DECLARE nome_p VARCHAR(50);
  DECLARE nome_s VARCHAR(50);
  DECLARE full_name VARCHAR(100);
  DECLARE bot_email VARCHAR(150);
  DECLARE bot_id INT;

  -- Contar nomes disponíveis
  SELECT COUNT(*) INTO total_names FROM bot_names;

  WHILE i <= 3000 DO
    -- Escolher primeiro nome e sobrenome aleatórios (independentes)
    SET idx_p = FLOOR(1 + RAND() * total_names);
    SET idx_s = FLOOR(1 + RAND() * total_names);

    SELECT primeiro INTO nome_p FROM bot_names LIMIT idx_p - 1, 1;
    SELECT sobrenome INTO nome_s FROM bot_names LIMIT idx_s - 1, 1;

    SET full_name = CONCAT(nome_p, ' ', nome_s);
    SET bot_email = CONCAT(LOWER(nome_p), '.', LOWER(nome_s), '.', i, '@bot.brcprint.com');

    -- Inserir apenas se o email ainda não existe
    IF NOT EXISTS (SELECT 1 FROM clients WHERE email = bot_email) THEN
      INSERT INTO clients (name, email, password_hash, created_at)
      VALUES (full_name, bot_email, '$2b$10$FakeHashForBotUsersOnly.DoNotUseInProduction', NOW());

      SET bot_id = LAST_INSERT_ID();

      -- Dar saldo inicial de lances para cada bot (200 lances)
      INSERT INTO client_bids_balance (client_id, balance)
      VALUES (bot_id, 200)
      ON DUPLICATE KEY UPDATE balance = balance;
    END IF;

    SET i = i + 1;
  END WHILE;
END$$

DELIMITER ;

-- Executar o seed
CALL seed_bots();

-- Limpar
DROP PROCEDURE IF EXISTS seed_bots;
DROP TEMPORARY TABLE IF EXISTS bot_names;

-- Verificar resultado
SELECT
  COUNT(*) AS total_bots_inseridos,
  SUM(cbb.balance) AS total_lances_disponiveis
FROM clients c
JOIN client_bids_balance cbb ON cbb.client_id = c.id
WHERE c.email LIKE '%@bot.brcprint.com';
