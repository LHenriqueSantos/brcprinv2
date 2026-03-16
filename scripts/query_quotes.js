const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'brcprint_mysql', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || 'brcprint_pass123', database: process.env.DB_NAME || 'brcprint_db', port: 3306
  });
  try {
    const [q] = await pool.query(`
      SELECT q.id, q.client_id, c.name, q.status, q.abandonment_email_sent, q.created_at, NOW() as n
      FROM quotes q
      JOIN clients c ON q.client_id = c.id
      WHERE q.status IN ('pending', 'quoted')
        AND q.abandonment_email_sent = 0
        AND q.created_at < NOW() - INTERVAL 24 HOUR
    `);
    console.log("Quotes matching target criteria:", q);
  } catch (e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}
run();
