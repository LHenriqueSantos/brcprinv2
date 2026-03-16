const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'brcprint_mysql', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || 'brcprint_pass123', database: process.env.DB_NAME || 'brcprint_db', port: 3306
  });
  try {
    await pool.query(`
      ALTER TABLE quotes
      ADD COLUMN abandonment_email_sent TINYINT(1) DEFAULT 0;
    `);
    console.log("Migration successful");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Column already exists");
    } else {
      console.error(e.message);
    }
  } finally {
    pool.end();
  }
}
run();
