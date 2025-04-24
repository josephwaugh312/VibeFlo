import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Create a pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined
});

// Define standard themes that match the built-in themes from development
const standardThemes = [
  {
    name: 'Deep Purple',
    description: 'The default VibeFlo theme with a vibrant purple palette',
    background_color: '#FFFFFF',
    text_color: '#333333',
    primary_color: '#6200EE',
    secondary_color: '#03DAC6',
    accent_color: '#BB86FC',
    is_dark: false,
    is_public: true
  },
  {
    name: 'Dark Theme',
    description: 'A sleek dark theme to reduce eye strain',
    background_color: '#121212',
    text_color: '#E1E1E1',
    primary_color: '#BB86FC',
    secondary_color: '#03DAC6',
    accent_color: '#CF6679',
    is_dark: true,
    is_public: true
  },
  {
    name: 'Ocean Blue',
    description: 'A calming blue theme inspired by the ocean',
    background_color: '#FFFFFF',
    text_color: '#333333',
    primary_color: '#1976D2',
    secondary_color: '#26A69A',
    accent_color: '#82B1FF',
    is_dark: false,
    is_public: true
  },
  {
    name: 'Forest Green',
    description: 'A refreshing green theme inspired by nature',
    background_color: '#FFFFFF',
    text_color: '#333333',
    primary_color: '#2E7D32',
    secondary_color: '#00897B',
    accent_color: '#66BB6A',
    is_dark: false,
    is_public: true
  },
  {
    name: 'Sunset Orange',
    description: 'A warm orange theme inspired by sunset colors',
    background_color: '#FFFFFF',
    text_color: '#333333',
    primary_color: '#F57C00',
    secondary_color: '#26A69A',
    accent_color: '#FFAB40',
    is_dark: false,
    is_public: true
  }
];

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
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      console.log('Creating custom_themes table...');
      
      // Create custom_themes table if it doesn't exist
      await client.query(`
        CREATE TABLE custom_themes (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          background_color VARCHAR(50) NOT NULL,
          text_color VARCHAR(50) NOT NULL,
          primary_color VARCHAR(50) NOT NULL,
          secondary_color VARCHAR(50) NOT NULL,
          accent_color VARCHAR(50) NOT NULL,
          is_default BOOLEAN DEFAULT false,
          is_dark BOOLEAN DEFAULT false,
          is_public BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      
      console.log('custom_themes table created successfully');
    } else {
      // Check for missing columns and add them if they don't exist
      
      // Check if is_default column exists
      const defaultColumnCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'custom_themes'
          AND column_name = 'is_default'
        );
      `);
      
      if (!defaultColumnCheck.rows[0].exists) {
        console.log('Adding is_default column to custom_themes table...');
        await client.query(`
          ALTER TABLE custom_themes
          ADD COLUMN is_default BOOLEAN DEFAULT false;
        `);
        console.log('is_default column added successfully');
      }
      
      // Check if is_public column exists
      const publicColumnCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'custom_themes'
          AND column_name = 'is_public'
        );
      `);
      
      if (!publicColumnCheck.rows[0].exists) {
        console.log('Adding is_public column to custom_themes table...');
        await client.query(`
          ALTER TABLE custom_themes
          ADD COLUMN is_public BOOLEAN DEFAULT false;
        `);
        console.log('is_public column added successfully');
      }
      
      // Check if description column exists
      const descriptionColumnCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'custom_themes'
          AND column_name = 'description'
        );
      `);
      
      if (!descriptionColumnCheck.rows[0].exists) {
        console.log('Adding description column to custom_themes table...');
        await client.query(`
          ALTER TABLE custom_themes
          ADD COLUMN description TEXT;
        `);
        console.log('description column added successfully');
      }
    }
    
    // Get all users
    const users = await client.query(`
      SELECT id FROM users
    `);
    
    // Create default themes for all users if they don't exist
    console.log(`Found ${users.rows.length} users, creating standard themes for each...`);
    
    // Insert standard themes for each user
    for (const user of users.rows) {
      // Check if user already has themes
      const userThemes = await client.query(`
        SELECT COUNT(*) FROM custom_themes WHERE user_id = $1
      `, [user.id]);
      
      if (parseInt(userThemes.rows[0].count) === 0) {
        console.log(`Creating standard themes for user ${user.id}...`);
        
        // Add all standard themes for this user
        for (let i = 0; i < standardThemes.length; i++) {
          const theme = standardThemes[i];
          const isDefault = i === 0; // First theme is default
          
          await client.query(`
            INSERT INTO custom_themes (
              user_id, name, description, background_color, text_color, primary_color, 
              secondary_color, accent_color, is_default, is_dark, is_public
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            )
          `, [
            user.id, 
            theme.name,
            theme.description,
            theme.background_color, 
            theme.text_color, 
            theme.primary_color,
            theme.secondary_color, 
            theme.accent_color, 
            isDefault, 
            theme.is_dark,
            theme.is_public
          ]);
        }
        
        console.log(`Created ${standardThemes.length} standard themes for user ${user.id}`);
      } else {
        console.log(`User ${user.id} already has themes`);
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