const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'brcprint_mysql', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || 'brcprint_pass123', database: process.env.DB_NAME || 'brcprint_db', port: 3306
  });
  try {
    // Pegar o ID do último cliente inserido ou criar um mock
    const [quotes] = await pool.query("SELECT id FROM quotes LIMIT 1");
    if (quotes.length > 0) {
      const qId = quotes[0].id;
      await pool.query(`
        UPDATE quotes
        SET created_at = DATE_SUB(NOW(), INTERVAL 26 HOUR),
            abandonment_email_sent = 0,
            status = 'pending'
        WHERE id = ?`,
        [qId]);
      console.log("Quote " + qId + " artificially aged exactly to trigger recovery");
    } else {
      console.log("No quotes found to age. Need to create one first.");
    }
  } catch (e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}
run();
