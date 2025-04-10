import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test user details - you can change these
const testUser = {
  name: 'Test User',
  username: 'testuser',
  email: 'test@example.com',
  password: 'TestPassword123',
  isVerified: true
};

async function createTestUser() {
  const client = await pool.connect();
  try {
    // Check if user with this email already exists
    const emailCheck = await client.query('SELECT * FROM users WHERE email = $1', [testUser.email]);
    if (emailCheck.rows.length > 0) {
      console.log(`A user with email ${testUser.email} already exists. Please use a different email.`);
      return;
    }

    // Check if user with this username already exists
    const usernameCheck = await client.query('SELECT * FROM users WHERE username = $1', [testUser.username]);
    if (usernameCheck.rows.length > 0) {
      console.log(`A user with username ${testUser.username} already exists. Please use a different username.`);
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testUser.password, salt);

    // Begin transaction
    await client.query('BEGIN');

    // Create new user
    const newUser = await client.query(
      'INSERT INTO users (name, username, email, password, is_verified) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [testUser.name, testUser.username, testUser.email, hashedPassword, testUser.isVerified]
    );

    const user = newUser.rows[0];
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Test user created successfully:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Name: ${user.name}`);
    console.log(`- Username: ${user.username}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Password: ${testUser.password} (plaintext for your reference only)`);
    console.log(`- Verified: ${user.is_verified}`);
    console.log('\nYou can now log in with these credentials to test the account deletion feature.');
  } catch (err) {
    // Rollback transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error creating test user:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

// Run the function
createTestUser(); 