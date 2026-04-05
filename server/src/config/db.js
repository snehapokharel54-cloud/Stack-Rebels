import pg from "pg";

const { Pool } = pg;

// Use .env credentials directly — no OS username guessing
const poolConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  database: process.env.DB_NAME || "grihastha",
  user: process.env.DB_USER || "postgres",
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10,
};

// Only add password if provided
if (process.env.DB_PASSWORD) {
  poolConfig.password = process.env.DB_PASSWORD;
}

const pool = new Pool(poolConfig);

// Handle pool errors without crashing the process
pool.on("error", (err) => {
  console.error("[DB] Unexpected error on idle client:", err.message);
});

/**
 * Execute a parameterized query against the database.
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<import("pg").QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

export { pool, query };
export default pool;
