import * as dotenv from 'dotenv';
import pool from '../config/db';

// Load environment variables
dotenv.config();

// Function to check if a user exists by email
export async function checkUserByEmail(email: string) {
  try {
    console.log(`Checking for user with email: ${email}`);
    
    // Check users table
    const userResult = await pool.query('SELECT id, email, username, is_verified FROM users WHERE email = $1', [email]);
    console.log(`User records found: ${userResult.rows.length}`);
    console.log(`User data:`, userResult.rows);
    
    // Check verification_tokens table if needed
    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      const tokenResult = await pool.query('SELECT * FROM verification_tokens WHERE user_id = $1', [userId]);
      console.log(`Verification tokens found: ${tokenResult.rows.length}`);
      console.log(`Token data:`, tokenResult.rows);
    }
    
    return {
      exists: userResult.rows.length > 0,
      userData: userResult.rows[0] || null,
      tokens: userResult.rows.length > 0 ? await pool.query('SELECT * FROM verification_tokens WHERE user_id = $1', [userResult.rows[0].id]) : []
    };
  } catch (error) {
    console.error('Error checking user:', error);
    throw error;
  }
}

// If this script is run directly (not imported)
if (require.main === module) {
  const email = process.argv[2] || 'lisaberndt1970@gmail.com';
  
  checkUserByEmail(email)
    .then(result => {
      console.log('Check completed:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error('Unhandled error:', err);
      process.exit(1);
    });
} 