import * as dotenv from 'dotenv';
import pool from '../config/db';

// Load environment variables
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
console.log(`Environment mode: ${isProduction ? 'Production' : 'Development'}`);

async function runMigration() {
  console.log('Starting token_expiry migration script...');
  console.log(`Attempting to connect to database with URL: ${process.env.DATABASE_URL ? 'From environment' : 'Not set'}`);
  console.log(`SSL enabled for database connection: ${isProduction ? 'yes' : 'no'}`);
  
  try {
    console.log('Acquiring database client from pool...');
    const client = await pool.connect();
    console.log('Successfully connected to database!');
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Check if users table exists
      const tableCheckResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);
      
      if (!tableCheckResult.rows[0].exists) {
        console.log('Users table does not exist, skipping migration');
        return;
      }
      
      console.log('Users table exists, checking for token_expiry column...');
      
      // Check if column exists
      const columnCheckResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'users' 
          AND column_name = 'token_expiry'
        );
      `);
      
      if (columnCheckResult.rows[0].exists) {
        console.log('token_expiry column already exists, migration not needed');
      } else {
        console.log('Adding token_expiry column to users table...');
        
        // Add token_expiry column
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN token_expiry TIMESTAMP WITH TIME ZONE DEFAULT NULL;
        `);
        
        console.log('token_expiry column added successfully to users table');
      }
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('Migration completed successfully');
      
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('Error during migration:', error);
      throw error;
    } finally {
      client.release();
      console.log('Released database client back to pool');
    }
    
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  } finally {
    // Close the pool when done
    await pool.end();
    console.log('Database pool closed');
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('token_expiry migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 