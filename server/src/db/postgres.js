import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool, types } = pg;

// Return NUMERIC columns (prices, totals, stock) as JS numbers instead of strings.
types.setTypeParser(types.builtins.NUMERIC, value =>
  value === null ? null : parseFloat(value)
);

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. The server needs PostgreSQL to store data.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Most hosted Postgres providers (Render, Neon, Supabase, RDS) require SSL.
  ssl:
    process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: false }
      : undefined
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});

// Runs fn(client) inside a transaction; rolls back if it throws.
export async function withTransaction(fn) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
