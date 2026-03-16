const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'brcprint_mysql', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || 'brcprint_pass123', database: process.env.DB_NAME || 'brcprint_db', port: 3306
  });
  try {
    // 1. business_config
    await pool.query(`ALTER TABLE business_config ADD COLUMN enable_cashback TINYINT(1) DEFAULT 0;`).catch(e => { if (e.code !== 'ER_DUP_FIELDNAME') throw e; });
    await pool.query(`ALTER TABLE business_config ADD COLUMN cashback_pct DECIMAL(5,2) DEFAULT 5.00;`).catch(e => { if (e.code !== 'ER_DUP_FIELDNAME') throw e; });

    // 2. clients
    await pool.query(`ALTER TABLE clients ADD COLUMN credit_balance DECIMAL(10,2) DEFAULT 0.00;`).catch(e => { if (e.code !== 'ER_DUP_FIELDNAME') throw e; });

    // 3. quotes
    await pool.query(`ALTER TABLE quotes ADD COLUMN credits_used DECIMAL(10,2) DEFAULT 0.00;`).catch(e => { if (e.code !== 'ER_DUP_FIELDNAME') throw e; });

    console.log("Migration for Cashback successful");
  } catch (e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}
run();
