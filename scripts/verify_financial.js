const mysql = require('mysql2/promise');

async function test() {
  const connection = await mysql.createConnection({
    host: 'brcprint_mysql',
    user: 'brcprint_user',
    password: 'brcprint_pass123',
    database: 'brcprint_db'
  });

  try {
    console.log('--- Testing Financial DRE Logic ---');

    const today = new Date().toISOString().split('T')[0];
    const period = today.slice(0, 7);

    // 1. Insert a mock expense
    console.log('Inserting mock expenses...');
    await connection.query(
      `INSERT INTO expenses (description, amount, category, due_date, status, type, payment_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['Test Fixed Expense', 500, 'Aluguel', today, 'paid', 'fixed', today]
    );
    await connection.query(
      `INSERT INTO expenses (description, amount, category, due_date, status, type, payment_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['Test Variable Expense', 200, 'Marketing', today, 'paid', 'variable', today]
    );

    // 2. Query as the DRE API does
    console.log(`Running DRE query for period ${period}...`);

    const [expenseRows] = await connection.query(`
      SELECT
        type,
        SUM(amount) as total
      FROM expenses
      WHERE status = 'paid'
        AND DATE_FORMAT(payment_date, '%Y-%m') = ?
      GROUP BY type
    `, [period]);

    console.log('Expense Totals:', expenseRows);

    const fixed = Number(expenseRows.find(r => r.type === 'fixed')?.total || 0);
    const variable = Number(expenseRows.find(r => r.type === 'variable')?.total || 0);

    if (fixed >= 500 && variable >= 200) {
      console.log('\x1b[32mSUCCESS: DRE expense categorization verified.\x1b[0m');
    } else {
      console.log('\x1b[31mFAILURE: DRE expense values mismatch.\x1b[0m');
    }

    // 3. Clean up (Softly, just identify the tests)
    console.log('Cleaning up mock data...');
    await connection.query("DELETE FROM expenses WHERE description LIKE 'Test % Expense'");

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

test();
