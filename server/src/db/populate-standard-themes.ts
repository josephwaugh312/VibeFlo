import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Create a pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined
});

// Define standard themes with fixed UUIDs that match what's in use
const standardThemes = [
  {
    id: 'd8a7c463-e2a0-4b15-9c1b-cb1d4e59d933',
    name: 'Abstract',
    description: 'A modern abstract theme with vibrant colors',
    background_color: '#FFFFFF',
    text_color: '#333333',
    primary_color: '#FF4081',
    secondary_color: '#3F51B5',
    accent_color: '#FF9800',
    is_dark: false,
    is_default: false,
    is_public: true,
    image_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8YWJzdHJhY3R8ZW58MHx8MHx8&w=1000&q=80'
  },
  {
    id: 'fd8b7d61-fec0-48e6-a2da-52a1b5c9887c',
    name: 'Cityscape',
    description: 'Urban cityscape theme with modern aesthetics',
    background_color: '#FFFFFF',
    text_color: '#333333',
    primary_color: '#2196F3',
    secondary_color: '#607D8B',
    accent_color: '#FFC107',
    is_dark: false,
    is_default: false,
    is_public: true,
    image_url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8Y2l0eXxlbnwwfHwwfHw%3D&w=1000&q=80'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Classic Light',
    description: 'Clean and minimalist light theme',
    background_color: '#FFFFFF',
    text_color: '#333333',
    primary_color: '#1976D2',
    secondary_color: '#757575',
    accent_color: '#FF4081',
    is_dark: false,
    is_default: true,
    is_public: true,
    image_url: 'https://images.unsplash.com/photo-1541629908-9d9ea3ffa97a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8bWluaW1hbHxlbnwwfHwwfHw%3D&w=1000&q=80'
  },
  {
    id: 'a3e0f1d8-5c22-4b23-9c5a-b1d1c1a9b7a2',
    name: 'Forest',
    description: 'Peaceful forest scene with soft lighting',
    background_color: '#FFFFFF',
    text_color: '#333333',
    primary_color: '#4CAF50',
    secondary_color: '#8BC34A',
    accent_color: '#FF9800',
    is_dark: false,
    is_default: false,
    is_public: true,
    image_url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Zm9yZXN0JTIwYmFja2dyb3VuZHxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80'
  },
  {
    id: 'e4b0c7d2-267a-4c46-860a-e6c48cc0d4e0',
    name: 'Minimalist',
    description: 'Clean, minimalist background with subtle geometric patterns',
    background_color: '#FFFFFF',
    text_color: '#333333',
    primary_color: '#9C27B0',
    secondary_color: '#E91E63',
    accent_color: '#00BCD4',
    is_dark: false,
    is_default: false,
    is_public: true,
    image_url: 'https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z3JhZGllbnQlMjBiYWNrZ3JvdW5kfGVufDB8fDB8fHww&w=1000&q=80'
  }
];

/**
 * Populate standard themes with fixed UUIDs
 */
async function populateStandardThemes() {
  const client = await pool.connect();
  
  try {
    console.log('Starting population of standard themes with fixed UUIDs...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if themes table exists
    const themesTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'themes'
      );
    `);
    
    if (!themesTableCheck.rows[0].exists) {
      console.log('Themes table does not exist, creating it...');
      await client.query(`
        CREATE TABLE themes (
          id UUID PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          background_color VARCHAR(50) DEFAULT '#FFFFFF',
          text_color VARCHAR(50) DEFAULT '#333333',
          primary_color VARCHAR(50) DEFAULT '#6200EE',
          secondary_color VARCHAR(50) DEFAULT '#03DAC6',
          accent_color VARCHAR(50) DEFAULT '#BB86FC',
          is_default BOOLEAN DEFAULT false,
          is_dark BOOLEAN DEFAULT false,
          is_public BOOLEAN DEFAULT true,
          image_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('Themes table created successfully');
    }
    
    // Check for uuid extension
    const uuidExtensionCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
      );
    `);
    
    if (!uuidExtensionCheck.rows[0].exists) {
      console.log('Creating uuid-ossp extension...');
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    }
    
    // Skip deletion and just use UPSERT to insert/update themes
    console.log('Upserting standard themes...');
    
    // Insert standard themes with fixed UUIDs
    for (const theme of standardThemes) {
      console.log(`Upserting theme: ${theme.name} with ID: ${theme.id}`);
      
      // Check if theme exists
      const themeExists = await client.query('SELECT id FROM themes WHERE id = $1', [theme.id]);
      
      if (themeExists.rows.length > 0) {
        console.log(`Theme with ID ${theme.id} exists, updating...`);
      } else {
        console.log(`Theme with ID ${theme.id} does not exist, inserting...`);
      }
      
      await client.query(`
        INSERT INTO themes (
          id, name, description, background_color, text_color, primary_color, 
          secondary_color, accent_color, is_default, is_dark, is_public, image_url
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        ) ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          background_color = EXCLUDED.background_color,
          text_color = EXCLUDED.text_color,
          primary_color = EXCLUDED.primary_color,
          secondary_color = EXCLUDED.secondary_color,
          accent_color = EXCLUDED.accent_color,
          is_default = EXCLUDED.is_default,
          is_dark = EXCLUDED.is_dark,
          is_public = EXCLUDED.is_public,
          image_url = EXCLUDED.image_url,
          updated_at = NOW()
      `, [
        theme.id,
        theme.name,
        theme.description,
        theme.background_color,
        theme.text_color,
        theme.primary_color,
        theme.secondary_color,
        theme.accent_color,
        theme.is_default,
        theme.is_dark,
        theme.is_public,
        theme.image_url
      ]);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Standard themes population completed successfully');
    
  } catch (err) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error populating standard themes:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run the population
populateStandardThemes()
  .then(() => {
    console.log('Successfully populated standard themes with fixed UUIDs');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to populate standard themes:', err);
    process.exit(1);
  }); 