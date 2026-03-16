const mysql = require('mysql2/promise');

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'brcprint_mysql',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'brcprint123',
    database: process.env.DB_NAME || 'brcprint',
  });

  try {
    console.log("Creating reviews table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quote_id INT NOT NULL,
        client_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        photo_url VARCHAR(255),
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Adding review_requested_at to quotes table...");
    try {
      await pool.query("ALTER TABLE quotes ADD COLUMN review_requested_at DATETIME DEFAULT NULL");
      console.log("review_requested_at column added.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log("Column review_requested_at already exists.");
      } else {
        throw e;
      }
    }

    console.log("Migration for reviews completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}

migrate();
