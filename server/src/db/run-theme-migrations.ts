import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Create a pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined
});

/**
 * Run database migrations for theme-related tables
 */
async function runThemeMigrations() {
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if custom_themes table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'custom_themes'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Creating custom_themes table...');
      
      // Create custom_themes table if it doesn't exist
      await client.query(`
        CREATE TABLE custom_themes (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          background_color VARCHAR(50) NOT NULL,
          text_color VARCHAR(50) NOT NULL,
          primary_color VARCHAR(50) NOT NULL,
          secondary_color VARCHAR(50) NOT NULL,
          accent_color VARCHAR(50) NOT NULL,
          is_default BOOLEAN DEFAULT false,
          is_dark BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      
      console.log('custom_themes table created successfully');
    } else {
      // Check if is_default column exists
      const columnCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'custom_themes'
          AND column_name = 'is_default'
        );
      `);
      
      if (!columnCheck.rows[0].exists) {
        console.log('Adding is_default column to custom_themes table...');
        
        // Add the is_default column if it doesn't exist
        await client.query(`
          ALTER TABLE custom_themes
          ADD COLUMN is_default BOOLEAN DEFAULT false;
        `);
        
        console.log('is_default column added successfully');
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Theme migrations completed successfully');
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error running theme migrations:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runThemeMigrations()
  .then(() => {
    console.log('Theme migration script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration script failed:', error);
    process.exit(1);
  }); 