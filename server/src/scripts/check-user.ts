import pool from '../config/db';

async function checkUser(email: string) {
  try {
    console.log(`Checking user with email: ${email}`);
    
    // Query the user
    const userResult = await pool.query(
      'SELECT id, email, username, is_verified, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.log('User not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('User found:');
    console.log(JSON.stringify(user, null, 2));
    
    // Also check if there are any verification tokens for this user
    const tokenResult = await pool.query(
      'SELECT * FROM verification_tokens WHERE user_id = $1',
      [user.id]
    );
    
    if (tokenResult.rows.length === 0) {
      console.log('No verification tokens found for this user');
    } else {
      console.log('Verification tokens:');
      console.log(JSON.stringify(tokenResult.rows, null, 2));
    }
    
    // Check user's login history
    const loginResult = await pool.query(
      'SELECT created_at FROM login_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [user.id]
    );
    
    if (loginResult.rows.length === 0) {
      console.log('No login history found for this user');
    } else {
      console.log('Recent login history:');
      console.log(JSON.stringify(loginResult.rows, null, 2));
    }
    
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    // Close the pool to end the script properly
    await pool.end();
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email as a command line argument');
  process.exit(1);
}

checkUser(email).catch(console.error); 