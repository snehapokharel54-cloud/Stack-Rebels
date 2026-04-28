import pg from 'pg';
const pool = new pg.Pool({ user: 'piyushrauniyar', host: 'localhost', database: 'grihastha', port: 5432 });

async function run() {
  try {
    const titles = ['msandkanfk', 'cdsjknkjd', 'dsmxcmldsvx'];
    const res = await pool.query(
      `DELETE FROM listings WHERE title = ANY($1) RETURNING title`,
      [titles]
    );
    console.log(`Deleted ${res.rowCount} properties:`, res.rows.map(r => r.title));
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    pool.end();
  }
}
run();
