
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'grihastha',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function run() {
  try {
    console.log('--- Recent Bookings ---');
    const bRes = await pool.query('SELECT id, nights, price_per_night, total_price, price_breakdown FROM bookings ORDER BY created_at DESC LIMIT 3');
    console.log(JSON.stringify(bRes.rows, null, 2));

    console.log('\n--- Listing Prices ---');
    const lRes = await pool.query('SELECT id, title, price_per_night, cleaning_fee FROM listings LIMIT 5');
    console.log(JSON.stringify(lRes.rows, null, 2));

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
