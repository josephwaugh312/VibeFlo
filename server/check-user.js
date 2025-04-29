require('dotenv').config();
const { Pool } = require('pg');

const email = 'lisaberndt1970@gmail.com';

// Create connection pool with SSL disabled for local testing
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' && process.env.DISABLE_SSL !== 'true' ? 
    { rejectUnauthorized: false } : undefined
});

async function checkUser() {
  try {
    console.log('Checking for user with email:', email);
    
    // Check users table
    const userResult = await pool.query('SELECT id, email, username, is_verified FROM users WHERE email = $1', [email]);
    console.log('User records found:', userResult.rows.length);
    console.log('User data:', JSON.stringify(userResult.rows, null, 2));
    
    // Check verification_tokens table if needed
    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      const tokenResult = await pool.query('SELECT * FROM verification_tokens WHERE user_id = $1', [userId]);
      console.log('Verification tokens found:', tokenResult.rows.length);
      console.log('Token data:', JSON.stringify(tokenResult.rows, null, 2));
    }
    
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    pool.end();
  }
}

checkUser(); 