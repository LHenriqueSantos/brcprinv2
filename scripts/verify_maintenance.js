const mysql = require('mysql2/promise');

async function test() {
  const connection = await mysql.createConnection({
    host: 'brcprint_mysql', // Correct host inside Docker network
    user: 'brcprint_user',
    password: 'brcprint_pass123',
    database: 'brcprint_db',
    port: 3306 // Host port mapping might be different, but let's see.
  });

  try {
    console.log('--- Testing Maintenance & Stock Deduction ---');

    // 1. Get a consumable
    const [consumables] = await connection.query('SELECT id, name, stock_current FROM consumables WHERE active = 1 LIMIT 1');
    if (consumables.length === 0) {
      console.log('No consumables found to test.');
      return;
    }
    const consumable = consumables[0];
    const initialStock = Number(consumable.stock_current);
    console.log(`Consumable: ${consumable.name}, Initial Stock: ${initialStock}`);

    // 2. Get a printer
    const [printers] = await connection.query('SELECT id, name FROM printers WHERE active = 1 LIMIT 1');
    if (printers.length === 0) {
      console.log('No printers found to test.');
      return;
    }
    const printer = printers[0];
    console.log(`Printer: ${printer.name}`);

    // 3. Simulate maintenance via API logic (direct SQL for test)
    // We'll use the same logic as the API
    const maintenanceType = 'Test Maintenance ' + Date.now();
    const cost = 10;
    const desc = 'Test deduction';
    const quantityUsed = 2;

    const [maintResult] = await connection.query(
      'INSERT INTO printer_maintenance_logs (printer_id, maintenance_type, description, cost) VALUES (?, ?, ?, ?)',
      [printer.id, maintenanceType, desc, cost]
    );
    const maintLogId = maintResult.insertId;

    // Deduct stock
    await connection.query('UPDATE consumables SET stock_current = stock_current - ? WHERE id = ?', [quantityUsed, consumable.id]);

    // Register usage
    await connection.query(
      'INSERT INTO maintenance_consumables (maintenance_log_id, consumable_id, quantity, unit_cost) VALUES (?, ?, ?, ?)',
      [maintLogId, consumable.id, quantityUsed, 100] // Unit cost 100
    );

    console.log('Maintenance log and usage registered.');

    // 4. Verify stock
    const [updatedCons] = await connection.query('SELECT stock_current FROM consumables WHERE id = ?', [consumable.id]);
    const finalStock = Number(updatedCons[0].stock_current);
    console.log(`Final Stock: ${finalStock}`);

    if (finalStock === initialStock - quantityUsed) {
      console.log('\x1b[32mSUCCESS: Stock deduction verified.\x1b[0m');
    } else {
      console.log('\x1b[31mFAILURE: Stock deduction mismatch.\x1b[0m');
    }

    // 5. Verify ROI math in a query similar to Metrics API
    const [roiRows] = await connection.query(`
      SELECT
        p.name,
        (SELECT COALESCE(SUM(cost), 0) FROM printer_maintenance_logs WHERE printer_id = p.id) +
        (SELECT COALESCE(SUM(mc.quantity * mc.unit_cost), 0) FROM maintenance_consumables mc JOIN printer_maintenance_logs ml ON mc.maintenance_log_id = ml.id WHERE ml.printer_id = p.id) as total_maint
      FROM printers p WHERE p.id = ?
    `, [printer.id]);

    console.log(`Total Maint Cost for ${printer.name}: ${roiRows[0].total_maint}`);
    if (Number(roiRows[0].total_maint) >= cost + (quantityUsed * 100)) {
      console.log('\x1b[32mSUCCESS: ROI maintenance cost calculation verified.\x1b[0m');
    } else {
      console.log('\x1b[31mFAILURE: ROI cost calculation mismatch.\x1b[0m');
    }

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

test();
