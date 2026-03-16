const mysql = require('mysql2/promise');

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'brcprint_mysql',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'brcprint123',
    database: process.env.DB_NAME || 'brcprint',
  });

  try {
    console.log("Adding API columns to printers table...");

    const queriesPrinters = [
      "ALTER TABLE printers ADD COLUMN api_type ENUM('octoprint', 'moonraker', 'none') DEFAULT 'none'",
      "ALTER TABLE printers ADD COLUMN ip_address VARCHAR(255) DEFAULT NULL",
      "ALTER TABLE printers ADD COLUMN api_key VARCHAR(255) DEFAULT NULL",
      "ALTER TABLE printers ADD COLUMN is_online TINYINT DEFAULT 0"
    ];

    for (let q of queriesPrinters) {
      try {
        await pool.query(q);
        console.log(`Executed: ${q}`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log(`Column already exists: ${q}`);
        } else {
          console.error(`Error on query: ${q}`, e);
        }
      }
    }

    console.log("Adding IoT tracking columns to quotes table...");

    const queriesQuotes = [
      "ALTER TABLE quotes ADD COLUMN printer_id INT DEFAULT NULL",
      "ALTER TABLE quotes ADD COLUMN gcode_url VARCHAR(255) DEFAULT NULL"
    ];

    for (let q of queriesQuotes) {
      try {
        await pool.query(q);
        console.log(`Executed: ${q}`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log(`Column already exists: ${q}`);
        } else {
          console.error(`Error on query: ${q}`, e);
        }
      }
    }

    // Optional: Add foreign key for printer_id (Need to catch if it already exists)
    try {
      await pool.query("ALTER TABLE quotes ADD CONSTRAINT fk_quotes_printer FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE SET NULL");
      console.log("Added foreign key constraint fk_quotes_printer.");
    } catch (e) {
      // usually ER_CANT_CREATE_TABLE or ER_DUP_KEYName
      console.log("Constraint might already exist, skipping: ", e.message);
    }

    console.log("Migration for Printer APIs completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}

migrate();
