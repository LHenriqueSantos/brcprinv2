const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'brcprint_mysql', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || 'brcprint_pass123', database: process.env.DB_NAME || 'brcprint_db', port: 3306
  });
  try {
    const [res] = await pool.query('SELECT id, public_token, status, title FROM quotes ORDER BY id DESC LIMIT 5');
    console.table(res);
  } catch (e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}
run();
