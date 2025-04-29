import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Create a connection pool with proper SSL configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? {
    rejectUnauthorized: false // Required for Render PostgreSQL
  } : false
});

async function listUsers() {
  let client;
  
  try {
    console.log('Connecting to database with URL:', process.env.DATABASE_URL ? 'URL exists (hidden for security)' : 'DATABASE_URL not set');
    console.log('Environment:', isProduction ? 'Production' : 'Development');
    
    client = await pool.connect();
    console.log('Successfully connected to database');
    
    // Query all users
    console.log('Checking existing users in the database...');
    const result = await client.query('SELECT id, name, username, email, created_at FROM users');
    
    if (result.rows.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.log(`Found ${result.rows.length} users:`);
      result.rows.forEach(user => {
        console.log(`ID: ${user.id}, Name: ${user.name}, Username: ${user.username}, Email: ${user.email}, Created: ${user.created_at}`);
      });
    }
  } catch (err) {
    console.error('Error details:', err);
  } finally {
    if (client) {
      client.release();
    }
    process.exit(0);
  }
}

// Run the function
listUsers(); 