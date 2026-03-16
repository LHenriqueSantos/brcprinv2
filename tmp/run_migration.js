const fs = require('fs');
const mysql = require('mysql2/promise');
const { loadEnvConfig } = require('@next/env');

// Carrega variáveis do .env e .env.local
loadEnvConfig(process.cwd());

async function migrate() {
  const sql = fs.readFileSync('./db/migrate_password_resets.sql', 'utf8');

  const pool = mysql.createPool({
    host: "127.0.0.1",
    port: 3307,
    user: process.env.DB_USER || "brcprint_user",
    password: process.env.DB_PASSWORD || "brcprint_pass123",
    database: process.env.DB_NAME || "brcprint_db",
  });

  try {
    console.log('Executando a migração...');
    await pool.query(sql);
    console.log('Migração concluída com sucesso.');
  } catch (error) {
    console.error('Erro ao executar a migração:', error);
  } finally {
    await pool.end();
  }
}

migrate();
