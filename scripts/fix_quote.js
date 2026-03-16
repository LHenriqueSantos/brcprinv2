const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'brcprint_mysql', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || 'brcprint_pass123', database: process.env.DB_NAME || 'brcprint_db', port: 3306
  });
  try {
    // 1. Ensure client 1 exists
    const [clients] = await pool.query("SELECT id FROM clients WHERE id = 1");
    if (clients.length === 0) {
      await pool.query("INSERT INTO clients (id, name, email, phone) VALUES (1, 'Test Client', 'test@example.com', '5511999999999')");
    }

    // 2. Attach client 1 to quote 1
    await pool.query("UPDATE quotes SET client_id = 1 WHERE id = 1");
    console.log("Attached client 1 to quote 1.");
  } catch (e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}
run();
