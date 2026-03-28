require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const migrate = async () => {
  try {
    console.log('Migrating starred_boards table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS starred_boards (
        member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        board_id  INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        PRIMARY KEY (member_id, board_id)
      );
    `);
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
};

migrate();
