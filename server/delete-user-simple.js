require('dotenv').config();
const { Pool } = require('pg');

const userId = 'a41d2449-3e99-4490-a776-c106cb653e59'; // The ID of the account you want to delete

console.log('Attempting to delete user account for testing...');
console.log(`Target user ID: ${userId}`);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Render PostgreSQL
});

async function deleteUser() {
  try {
    // Verify the user exists
    const userResult = await pool.query('SELECT id, email, username FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      console.log(`No user found with ID: ${userId}`);
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`Found user: ${JSON.stringify(user)}`);
    
    // Use ON DELETE CASCADE or directly delete the user
    // First, check if there are any foreign key references to this user
    console.log('Checking for foreign key constraints...');
    const tablesResult = await pool.query(`
      SELECT tc.table_name, kcu.column_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'FOREIGN KEY' AND ccu.table_name='users' AND ccu.column_name='id'
    `);
    
    console.log('Tables with foreign keys to users:', tablesResult.rows);
    
    // Directly delete from the users table
    console.log('Directly deleting user...');
    const deleteResult = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    
    if (deleteResult.rows.length > 0) {
      console.log(`Successfully deleted user with ID: ${userId}`);
    } else {
      console.log(`Failed to delete user with ID: ${userId}`);
    }
    
  } catch (err) {
    console.error('Error deleting user:', err);
  } finally {
    pool.end();
  }
}

deleteUser(); 