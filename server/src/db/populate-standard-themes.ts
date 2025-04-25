import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
console.log('Starting standard themes population script...');
console.log(`Environment mode: ${process.env.NODE_ENV || 'not set'}`);

// Log database connection details (masking sensitive parts)
const connectionUrl = process.env.DATABASE_URL || 'not set';
const maskedUrl = connectionUrl.replace(/\/\/([^:]+):([^@]+)@/, '//********:********@');
console.log(`Attempting to connect to database with URL: ${maskedUrl}`);
console.log(`SSL enabled for database connection: ${isProduction ? 'yes' : 'no'}`);

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
    image_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
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
    image_url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
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
    is_default: false,
    is_public: true,
    image_url: 'https://images.unsplash.com/photo-1519638399535-1b036603ac77?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
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
    image_url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
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
    is_default: true,
    is_public: true,
    image_url: 'https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
  },
  {
    id: 'b5f87e7c-f98a-4a5e-8f8a-7e5b8be2b35d',
    name: 'Sunset Orange',
    description: 'A beautiful sunset scene with warm orange tones',
    background_color: '#FFFFFF',
    text_color: '#333333',
    primary_color: '#FF5722',
    secondary_color: '#FF9800',
    accent_color: '#FFEB3B',
    is_dark: false,
    is_default: false,
    is_public: true,
    image_url: 'https://images.pexels.com/photos/36717/amazing-animal-beautiful-beautifull.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: 'f48a7dc2-3b8a-49e7-b8c8-6a32d1e0c1b9',
    name: 'Ocean Blue',
    description: 'A calming blue theme inspired by the ocean',
    background_color: '#FFFFFF',
    text_color: '#333333',
    primary_color: '#039BE5',
    secondary_color: '#0288D1',
    accent_color: '#00BCD4',
    is_dark: false,
    is_default: false,
    is_public: true,
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
  },
  {
    id: 'c9d5a8f1-2b7c-4e9c-b1a3-9e5c8d7f6a2e',
    name: 'Mountain Peaks',
    description: 'Majestic mountain peaks with stunning views',
    background_color: '#FFFFFF',
    text_color: '#333333',
    primary_color: '#3F51B5',
    secondary_color: '#5C6BC0',
    accent_color: '#7986CB',
    is_dark: false,
    is_default: false,
    is_public: true,
    image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
  },
  {
    id: 'd7e6f5c4-3b2a-1c9d-8e7f-6a5b4c3d2e1f',
    name: 'Northern Lights',
    description: 'Vibrant aurora borealis dancing across the night sky',
    background_color: '#000000',
    text_color: '#FFFFFF',
    primary_color: '#9C27B0',
    secondary_color: '#4A148C',
    accent_color: '#7B1FA2',
    is_dark: true,
    is_default: false,
    is_public: true,
    image_url: 'https://images.pexels.com/photos/1933239/pexels-photo-1933239.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: 'e2d3c4b5-a6b7-c8d9-e0f1-a2b3c4d5e6f7',
    name: 'Dark Elegance',
    description: 'A sleek dark theme with elegant aesthetics',
    background_color: '#121212',
    text_color: '#FFFFFF',
    primary_color: '#BB86FC',
    secondary_color: '#03DAC6',
    accent_color: '#CF6679',
    is_dark: true,
    is_default: false,
    is_public: true,
    image_url: 'https://images.unsplash.com/photo-1520034475321-cbe63696469a?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
  }
];

/**
 * Populate standard themes with fixed UUIDs
 */
async function populateStandardThemes() {
  console.log('Acquiring database client from pool...');
  let client;
  
  try {
    client = await pool.connect();
    console.log('Successfully connected to database!');
    
    console.log('Starting population of standard themes with fixed UUIDs...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if themes table exists
    console.log('Checking if themes table exists...');
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
          is_standard BOOLEAN DEFAULT false,
          image_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('Themes table created successfully');
    } else {
      // Check if is_standard column exists
      console.log('Checking if is_standard column exists...');
      const columnCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'themes'
          AND column_name = 'is_standard'
        );
      `);
      
      if (!columnCheck.rows[0].exists) {
        console.log('Adding is_standard column to themes table...');
        await client.query(`
          ALTER TABLE themes 
          ADD COLUMN is_standard BOOLEAN DEFAULT false;
        `);
        console.log('is_standard column added successfully');
      } else {
        console.log('is_standard column already exists');
      }
    }
    
    // Check for uuid extension
    console.log('Checking for uuid-ossp extension...');
    const uuidExtensionCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
      );
    `);
    
    if (!uuidExtensionCheck.rows[0].exists) {
      console.log('Creating uuid-ossp extension...');
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    }
    
    // Log all column names from themes table for debugging
    console.log('Getting column names from themes table...');
    const columnInfo = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'themes'
      ORDER BY ordinal_position;
    `);
    
    console.log('Available columns in themes table:');
    if (columnInfo.rows.length > 0) {
      columnInfo.rows.forEach(row => console.log(`- ${row.column_name}`));
    } else {
      console.log('No columns found in themes table (unexpected)');
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
          secondary_color, accent_color, is_default, is_dark, is_public, image_url, 
          is_standard
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true
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
          is_standard = true,
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
      console.log(`Theme ${theme.name} upserted successfully`);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Standard themes population completed successfully');
    
  } catch (err) {
    // Rollback the transaction in case of error
    console.error('Error during database operations:', err);
    if (client) {
      console.log('Rolling back transaction due to error');
      await client.query('ROLLBACK');
    }
    console.error('Error populating standard themes:', err);
    throw err;
  } finally {
    if (client) {
      console.log('Releasing database client back to pool');
      client.release();
    }
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
    // Log more details about the error
    if (err.code === 'ECONNREFUSED') {
      console.error('Connection refused. Check if the database server is running and accessible.');
      console.error(`Attempted connection to: ${err.address}:${err.port}`);
    } else if (err.code === 'ETIMEDOUT') {
      console.error('Connection timed out. Network issue or firewall problem.');
    } else if (err.code === 'ENOTFOUND') {
      console.error('Host not found. Check the hostname in your connection string.');
    }
    process.exit(1);
  }); 