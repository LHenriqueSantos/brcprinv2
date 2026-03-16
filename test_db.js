const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: 'mysql',
    user: 'brcprint_user',
    password: 'brcprint_pass123',
    database: 'brcprint_db'
  });
  const [rows] = await pool.query("SELECT id, title, status, end_time FROM auction_items");
  console.log("ALL AUCTION ITEMS:");
  console.dir(rows);
  process.exit(0);
}

test().catch(console.error);
