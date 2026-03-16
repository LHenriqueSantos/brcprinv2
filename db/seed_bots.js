const mysql = require('mysql2/promise');

// ============================================================
// SEED: 3000 Usuários Bot para Testes do Sistema de Leilão
// Ambiente: LOCAL / DOCKER apenas
// ============================================================

const primeiros = [
  'Ana', 'Bruno', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Juliana',
  'Kevin', 'Larissa', 'Marcos', 'Natalia', 'Otávio', 'Patricia', 'Rafael', 'Sandra', 'Thiago', 'Ursula',
  'Victor', 'Wanessa', 'Alexandre', 'Beatriz', 'Caio', 'Diana', 'Enzo', 'Flavia', 'Gustavo', 'Heloisa',
  'Ivan', 'Joana', 'Kaique', 'Luana', 'Mateus', 'Nina', 'Oscar', 'Priscila', 'Rodrigo', 'Sabrina',
  'Tiago', 'Vanessa', 'Wesley', 'Yago', 'Adriana', 'Bernardo', 'Claudia', 'Davi', 'Elaine', 'Felipe',
  'Giovanna', 'Henrique', 'Iris', 'Jonas', 'Karina', 'Leonardo', 'Mariana', 'Nicolas', 'Olivia', 'Paulo',
  'Renata', 'Sergio', 'Tatiana', 'Ulisses', 'Valentina', 'William', 'Yara', 'Amanda', 'Camila', 'Diego',
  'Evelyn', 'Fabio', 'Grace', 'Humberto', 'Inês', 'Jeferson', 'Katia', 'Lucas', 'Mirela', 'Nelson',
  'Odete', 'Pamela', 'Roberta', 'Samuel', 'Tamara', 'Umberto', 'Veronica', 'Wander', 'Yolanda', 'Zelma',
  'Aline', 'Breno', 'Cecilia', 'Danilo', 'Edilson', 'Fatima', 'Gilberto', 'Hilda', 'Isadora', 'Jorge',
];

const sobrenomes = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Alves', 'Costa', 'Ferreira', 'Rodrigues',
  'Martins', 'Gomes', 'Ribeiro', 'Carvalho', 'Araujo', 'Nascimento', 'Melo', 'Barbosa', 'Xavier', 'Moreira',
  'Cardoso', 'Correia', 'Teixeira', 'Dias', 'Nunes', 'Batista', 'Moraes', 'Lopes', 'Vieira', 'Monteiro',
  'Machado', 'Cavalcante', 'Medeiros', 'Cunha', 'Neto', 'Rocha', 'Andrade', 'Farias', 'Braga', 'Freitas',
  'Vasconcelos', 'Barros', 'Siqueira', 'Cruz', 'Pimentel', 'Azevedo', 'Campos', 'Borges', 'Porto', 'Mendes',
  'Guimarães', 'Fonseca', 'Torres', 'Rezende', 'Queiroz', 'Coelho', 'Luz', 'Ramos', 'Pinto', 'Sampaio',
  'Mesquita', 'Brito', 'Lacerda', 'Viana', 'Duarte', 'Coutinho', 'Magalhães', 'Castro', 'Nogueira', 'Freire',
  'Leite', 'Pacheco', 'Pessoa', 'Rolim', 'Figueiredo', 'Bastos', 'Ferraz', 'Patriota', 'Caldas', 'Serrano',
  'Benício', 'Leão', 'Barreto', 'Roque', 'Couto', 'Bentes', 'Assis', 'Salles', 'Paiva', 'Leal',
  'Macedo', 'Aragão', 'Cavalcanti', 'Prado', 'Albuquerque', 'Abreu', 'Caldeira', 'Dantas', 'Esteves', 'Fontes',
];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'brcprint_user',
    password: 'brcprint_pass123',
    database: 'brcprint_db',
  });

  console.log('✅ Conectado ao banco. Iniciando seed de 3000 bots...');

  let inserted = 0;
  let skipped = 0;

  for (let i = 1; i <= 3000; i++) {
    const primeiro = rand(primeiros);
    const sobre = rand(sobrenomes);
    const nome = `${primeiro} ${sobre}`;
    const email = `${primeiro.toLowerCase()}.${sobre.toLowerCase()}.${i}@bot.brcprint.com`;

    try {
      // Inserir cliente bot
      const [result] = await conn.execute(
        `INSERT IGNORE INTO clients (name, email, password_hash, created_at)
         VALUES (?, ?, ?, NOW())`,
        [nome, email, '$2b$10$FakeHashForBotTestsOnlyNotForProd']
      );

      if (result.affectedRows > 0) {
        const botId = result.insertId;

        // Creditar 200000 lances de saldo
        await conn.execute(
          `INSERT IGNORE INTO client_bids_balance (client_id, balance)
           VALUES (?, 200000)`,
          [botId]
        );

        inserted++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`Erro ao inserir bot ${i}:`, err.message);
    }

    if (i % 100 === 0) {
      process.stdout.write(`\r  → ${i}/3000 processados (${inserted} inseridos, ${skipped} ignorados)`);
    }
  }

  console.log(`\n\n🎉 Seed concluído!`);
  console.log(`   ✅ ${inserted} bots inseridos`);
  console.log(`   ⏭️  ${skipped} duplicados ignorados`);

  // Verificar resultado final
  const [rows] = await conn.execute(
    `SELECT COUNT(*) as total FROM clients WHERE email LIKE '%@bot.brcprint.com'`
  );
  console.log(`   📊 Total de bots no banco: ${rows[0].total}`);

  await conn.end();
}

seed().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
