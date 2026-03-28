const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  try {
    console.log('Migrating: Adding archived column to lists...');
    await pool.query('ALTER TABLE lists ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;');
    console.log('Success!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
