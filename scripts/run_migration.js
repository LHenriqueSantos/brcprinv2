const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'brcprint_mysql', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || 'brcprint_pass123', database: process.env.DB_NAME || 'brcprint_db', port: 3306
  });
  try {
    await pool.query(`
      ALTER TABLE business_config
      ADD COLUMN enable_mercadopago TINYINT(1) DEFAULT 0,
      ADD COLUMN mp_access_token VARCHAR(255) NULL,
      ADD COLUMN mp_public_key VARCHAR(255) NULL;
    `);
    console.log("Migration successful");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Columns already exist");
    } else {
      console.error(e.message);
    }
  } finally {
    pool.end();
  }
}
run();
