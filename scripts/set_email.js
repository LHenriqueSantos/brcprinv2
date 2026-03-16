const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'brcprint_mysql', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || 'brcprint_pass123', database: process.env.DB_NAME || 'brcprint_db', port: 3306
  });
  try {
    await pool.query("UPDATE clients SET email = 'valid@example.com' WHERE id = 1");
    console.log("Client 1 now has an email address.");
  } catch (e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}
run();
