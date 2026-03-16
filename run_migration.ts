import fs from 'fs';
import path from 'path';
import pool from './src/lib/db';

async function migrate() {
  try {
    const sql = fs.readFileSync(path.join(process.cwd(), 'db', 'migrate_gcode_catalog.sql'), 'utf8');
    console.log("Running migration...");
    await pool.query(sql);
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    pool.end();
  }
}

migrate();
