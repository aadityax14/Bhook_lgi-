import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});

export async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW() AS current_time');
    console.log('✅ PostgreSQL connected:', result.rows[0].current_time);
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
  }
}