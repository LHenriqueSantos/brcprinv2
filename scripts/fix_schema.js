const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({ host: process.env.DB_HOST || 'brcprint_mysql', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || 'brcprint_pass123', database: process.env.DB_NAME || 'brcprint_db', port: 3306 });
  try {
    const alterations = [
      "ALTER TABLE business_config ADD COLUMN default_tax_pct DECIMAL(5,2) DEFAULT 0",
      "ALTER TABLE business_config ADD COLUMN currency_code VARCHAR(10) DEFAULT 'BRL'",
      "ALTER TABLE business_config ADD COLUMN currency_symbol VARCHAR(10) DEFAULT 'R$'",
      "ALTER TABLE business_config ADD COLUMN language_default VARCHAR(10) DEFAULT 'pt'"
    ];
    for (const statement of alterations) {
      try {
        await pool.query(statement);
        console.log("Executed: ", statement);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log("Column already exists.");
        else throw e;
      }
    }
  } catch (e) { console.error(e.message); } finally { pool.end(); }
}
run();
