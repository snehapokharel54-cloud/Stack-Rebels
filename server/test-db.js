import 'dotenv/config';
import { query } from './src/config/db.js';

async function test() {
  try {
    console.log("Running query...");
    await query(
      `UPDATE payments SET status = 'succeeded', khalti_pidx = $2, updated_at = NOW()
       WHERE booking_id = $1`,
      ['b01e6af4-362c-4d02-9389-e4d22ed3dabc', undefined]
    );
    console.log("Success");
  } catch (err) {
    console.log("Error:", err);
  }
}
test();
