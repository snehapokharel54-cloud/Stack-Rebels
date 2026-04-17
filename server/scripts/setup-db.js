import pg from 'pg';
import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

async function setupDatabase() {
  // Try connecting as the current OS user first (common on macOS)
  const currentUser = os.userInfo().username;
  
  let adminPool;
  try {
    // Try with OS username first  (no password, trust auth)
    adminPool = new pg.Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      database: 'postgres',
      user: currentUser,
    });
    
    await adminPool.query('SELECT NOW()'); // Test connection
    console.log(`✅ Connected as user: ${currentUser}\n`);
  } catch (err1) {
    try {
      // Fall back to postgres user with credentials from .env
      adminPool = new pg.Pool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        database: 'postgres',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      });
      
      await adminPool.query('SELECT NOW()'); // Test connection
      console.log(`✅ Connected as user: ${process.env.DB_USER}\n`);
    } catch (err2) {
      console.error('❌ Could not connect to PostgreSQL');
      console.error(`\nTried connecting as:
  1. OS user "${currentUser}" (no password)
  2. DB_USER "${process.env.DB_USER}" with DB_PASSWORD from .env

❌ PostgreSQL Connection Failed!

Please ensure:
✓ PostgreSQL is running (on macOS: brew services start postgresql)
✓ Database host is correct: ${process.env.DB_HOST}
✓ Database port is correct: ${process.env.DB_PORT}
✓ User credentials are valid
✓ Or update .env with correct credentials\n`);
      throw err2;
    }
  }

  try {
    console.log('🗄️  Creating database if it doesn\'t exist...\n');

    // Check if database exists
    const result = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [process.env.DB_NAME]
    );

    if (result.rows.length === 0) {
      // Database doesn't exist, create it
      await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`✅ Database '${process.env.DB_NAME}' created successfully!\n`);
    } else {
      console.log(`✅ Database '${process.env.DB_NAME}' already exists\n`);
    }
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    throw error;
  } finally {
    await adminPool.end();
  }
}

setupDatabase().catch(err => {
  console.error('Failed to set up database:', err);
  process.exit(1);
});
