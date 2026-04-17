import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    console.log("Checking for fcm_token column...");
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT');
    console.log("Column fcm_token added or already exists.");
    
    console.log("Checking for payments columns...");
    await pool.query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway VARCHAR(50) DEFAULT \'stripe\'');
    await pool.query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS khalti_pidx VARCHAR(255)');
    await pool.query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_npr NUMERIC(10,2)');
    await pool.query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_usd_cents INTEGER');
    console.log("Payments columns verified.");
  } catch (err) {
    console.error("Migration error:", err.message);
  } finally {
    await pool.end();
  }
}

run();
