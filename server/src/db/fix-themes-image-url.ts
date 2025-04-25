import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Create a pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined
});

// Standard themes with image URLs
const themeImages = [
  {
    name: 'Deep Purple',
    image_url: 'https://picsum.photos/id/1025/1200/800'
  },
  {
    name: 'Dark Theme',
    image_url: 'https://picsum.photos/id/1031/1200/800'
  },
  {
    name: 'Ocean Blue',
    image_url: 'https://picsum.photos/id/1002/1200/800'
  },
  {
    name: 'Forest Green',
    image_url: 'https://picsum.photos/id/15/1200/800'
  },
  {
    name: 'Sunset Orange',
    image_url: 'https://picsum.photos/id/96/1200/800'
  }
];

/**
 * Fix the themes table by adding image_url column if missing
 */
async function fixThemesImageUrl() {
  const client = await pool.connect();
  
  try {
    console.log('Starting image_url fix for themes table...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if the themes table exists
    const themesTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'themes'
      );
    `);
    
    const themesTableExists = themesTableCheck.rows[0].exists;
    
    if (!themesTableExists) {
      console.log('Themes table does not exist, cannot apply fix.');
      return;
    }
    
    // Check if image_url column exists
    const imageUrlColumnCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'themes'
        AND column_name = 'image_url'
      );
    `);
    
    if (!imageUrlColumnCheck.rows[0].exists) {
      console.log('Adding image_url column to themes table...');
      await client.query(`
        ALTER TABLE themes
        ADD COLUMN image_url TEXT;
      `);
      
      console.log('image_url column added successfully');
      
      // Update existing themes with image URLs
      for (const theme of themeImages) {
        console.log(`Updating image URL for theme: ${theme.name}`);
        await client.query(`
          UPDATE themes 
          SET image_url = $1
          WHERE name = $2
        `, [theme.image_url, theme.name]);
      }
      
      console.log('Updated image URLs for existing themes');
    } else {
      console.log('image_url column already exists in themes table');
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Fix completed successfully');
    
  } catch (err) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error fixing themes table:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run the fix
fixThemesImageUrl()
  .then(() => {
    console.log('Successfully fixed themes table structure');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to fix themes table:', err);
    process.exit(1);
  }); 