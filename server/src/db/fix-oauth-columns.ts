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

async function fixOAuthColumns() {
  let client;
  
  try {
    console.log('Starting OAuth columns fix script...');
    console.log('Environment mode:', isProduction ? 'Production' : 'Development');
    const databaseUrl = process.env.DATABASE_URL;
    console.log('Attempting to connect to database with URL:', databaseUrl ? 
      `${databaseUrl.split('@')[0].split(':').slice(0, -1).join(':')}:***@${databaseUrl.split('@')[1]}` : 
      'DATABASE_URL not set');
    console.log('SSL enabled for database connection:', isProduction ? 'yes' : 'no');
    
    client = await pool.connect();
    console.log('Successfully connected to database!');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Check if users table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.error('Users table does not exist!');
      return;
    }
    
    console.log('Users table exists, checking for OAuth columns...');
    
    // Check for required OAuth columns
    const oauthColumns = ['google_id', 'github_id', 'facebook_id'];
    
    for (const column of oauthColumns) {
      const columnExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'users' 
          AND column_name = $1
        );
      `, [column]);
      
      if (!columnExists.rows[0].exists) {
        console.log(`Column ${column} does not exist. Adding it...`);
        await client.query(`ALTER TABLE users ADD COLUMN ${column} VARCHAR(255)`);
        console.log(`Column ${column} added successfully`);
      } else {
        console.log(`Column ${column} already exists`);
      }
    }
    
    // Check for avatar_url column
    const avatarColumnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'avatar_url'
      );
    `);
    
    if (!avatarColumnExists.rows[0].exists) {
      console.log('Column avatar_url does not exist. Adding it...');
      await client.query(`ALTER TABLE users ADD COLUMN avatar_url TEXT`);
      console.log('Column avatar_url added successfully');
    } else {
      console.log('Column avatar_url already exists');
    }
    
    // Check for is_verified column
    const verifiedColumnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'is_verified'
      );
    `);
    
    if (!verifiedColumnExists.rows[0].exists) {
      console.log('Column is_verified does not exist. Adding it...');
      await client.query(`ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE`);
      console.log('Column is_verified added successfully');
    } else {
      console.log('Column is_verified already exists');
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('OAuth columns fix completed successfully');
    
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error fixing OAuth columns:', error);
  } finally {
    if (client) {
      client.release();
      console.log('Released database client back to pool');
    }
    process.exit(0);
  }
}

// Run the function
fixOAuthColumns(); 