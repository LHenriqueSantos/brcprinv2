const mysql = require("mysql2/promise");

async function check() {
  const pool = mysql.createPool({
    host: "localhost",
    port: 3307,
    user: "brcprint_user",
    password: "brcprint_pass123",
    database: "brcprint_db",
  });

  try {
    const [rows] = await pool.query("DESCRIBE catalog_items");
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
