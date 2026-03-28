require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL || '';
const needsSsl = dbUrl.includes('supabase') || dbUrl.includes('neon');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 15000,
});

const run = async () => {
  const schemaPath = path.join(__dirname, '..', 'src', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  
  try {
    console.log('Running schema against:', dbUrl.replace(/\/\/.*@/, '//***@'));
    await pool.query(sql);
    console.log('✅ Schema + seed data applied successfully!');
  } catch (err) {
    console.error('❌ Schema failed:', err.message);
  } finally {
    await pool.end();
  }
};

run();
