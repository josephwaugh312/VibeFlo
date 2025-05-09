import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function listUsers() {
  let client;
  
  try {
    client = await pool.connect();
    
    // Query all users - exactly as expected by test
    console.log('Checking existing users in the database...');
    const result = await client.query('SELECT id, name, username, email FROM users');
    
    if (result.rows.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.log(`Found ${result.rows.length} users:`);
      result.rows.forEach(user => {
        console.log(`ID: ${user.id}, Name: ${user.name}, Username: ${user.username}, Email: ${user.email}`);
      });
    }
  } catch (err) {
    console.error('Error checking users:', err);
  } finally {
    if (client) {
      client.release();
    }
    process.exit(0);
  }
}

// Run the function
listUsers(); 