import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
import os from 'os';

const { Pool } = pg;

// Load environment variables
dotenv.config({ path: new URL('../.env', import.meta.url) });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createPool() {
  const currentUser = os.userInfo().username;
  
  try {
    // Try with OS username first (common on macOS)
    const testPool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      database: process.env.DB_NAME,
      user: currentUser,
    });
    
    await testPool.query('SELECT NOW()'); // Test connection
    testPool.end();
    
    return new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      database: process.env.DB_NAME,
      user: currentUser,
    });
  } catch (err1) {
    // Fall back to .env credentials
    return new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
  }
}

async function runMigrations() {
  let pool;
  try {
    console.log('🔧 Starting database migrations...\n');

    pool = await createPool();
    
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`📝 Running migration: ${file}`);
      
      try {
        await pool.query(sql);
        console.log(`✅ Successfully executed: ${file}\n`);
      } catch (err) {
        console.error(`❌ Error executing ${file}:`, err.message);
        throw err;
      }
    }

    console.log(
      '✨ All migrations completed successfully!\n' +
      '📋 Database schema is now up to date.'
    );
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    if (pool) await pool.end();
  }
}

runMigrations();
