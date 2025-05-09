require('dotenv').config();
const { Pool } = require('pg');

console.log('Listing all users in the database...');
console.log('Using DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Render PostgreSQL
});

async function listUsers() {
  try {
    const result = await pool.query(`
      SELECT id, email, name, username, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('No users found in the database');
      return;
    }
    
    console.log(`Found ${result.rows.length} users:`);
    result.rows.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email || 'null'}`);
      console.log(`Name: ${user.name || 'null'}`);
      console.log(`Username: ${user.username || 'null'}`);
      console.log(`Created: ${user.created_at}`);
      console.log('-------------------');
    });
    
  } catch (err) {
    console.error('Error listing users:', err);
  } finally {
    pool.end();
  }
}

listUsers(); 