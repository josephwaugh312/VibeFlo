require('dotenv').config();
const { Pool } = require('pg');

console.log('Testing connection to Render database...');
console.log('Using DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // This might be needed for Render's PostgreSQL
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Successfully connected to Render database!');
    console.log('Server time:', res.rows[0].now);
  }
  pool.end();
}); 