import { pool } from '../config/db.js';

async function migrate() {
  try {
    console.log("Adding columns to payments table...");
    await pool.query(`
      ALTER TABLE payments 
      ADD COLUMN IF NOT EXISTS gateway VARCHAR(50) DEFAULT 'stripe',
      ADD COLUMN IF NOT EXISTS khalti_pidx VARCHAR(255);
    `);
    console.log("Added gateway and khalti_pidx columns");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}

migrate();
