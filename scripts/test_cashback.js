const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({ host: process.env.DB_HOST || 'brcprint_mysql', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || 'brcprint_pass123', database: process.env.DB_NAME || 'brcprint_db', port: 3306 });
  try {
    await pool.query("UPDATE business_config SET enable_cashback = 1, cashback_pct = 10, enable_mercadopago = 1, mp_access_token = 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000' WHERE id = 1");

    // Check if we have any quotes
    const [rows] = await pool.query("SELECT id, public_token, client_id FROM quotes LIMIT 1");
    if (rows.length === 0) {
      console.log("NO QUOTES FOUND");
      return;
    }

    const quote = rows[0];

    // Ensure client exists and has balance
    let clientId = quote.client_id;
    if (!clientId) {
      const [c] = await pool.query("INSERT INTO clients (name, email, phone, credit_balance) VALUES ('Cliente VIP', 'vip@teste.com', '11999999999', 50.00)");
      clientId = c.insertId;
    }
    await pool.query("UPDATE clients SET credit_balance = 50.00 WHERE id = ?", [clientId]);

    // Update quote Status to quoted so it can be approved
    await pool.query("UPDATE quotes SET status = 'quoted', final_price = 250.00, client_id = ?, payment_method = NULL, mp_payment_id = NULL, pix_qr_code = NULL, credits_used = 0 WHERE id = ?", [clientId, quote.id]);

    console.log("TEST_TOKEN=" + quote.public_token);
    console.log("http://localhost:3000/portal/" + quote.public_token);
  } catch (e) { console.error(e.message); } finally { pool.end(); }
}
run();
