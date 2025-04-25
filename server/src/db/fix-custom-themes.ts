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
 * Fix the custom_themes table by adding missing columns
 */
async function fixCustomThemes() {
  const client = await pool.connect();
  
  try {
    console.log('Starting fix for custom_themes table...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if the custom_themes table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'custom_themes'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      console.log('Creating custom_themes table from scratch...');
      await client.query(`
        CREATE TABLE custom_themes (
          id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          background_color VARCHAR(50) DEFAULT '#FFFFFF',
          text_color VARCHAR(50) DEFAULT '#333333',
          primary_color VARCHAR(50) DEFAULT '#6200EE',
          secondary_color VARCHAR(50) DEFAULT '#03DAC6',
          accent_color VARCHAR(50) DEFAULT '#BB86FC',
          is_default BOOLEAN DEFAULT false,
          is_dark BOOLEAN DEFAULT false,
          is_public BOOLEAN DEFAULT false,
          image_url TEXT,
          prompt TEXT,
          moderation_status VARCHAR(50) DEFAULT 'approved',
          moderation_notes TEXT,
          moderation_date TIMESTAMPTZ,
          reported_count INTEGER DEFAULT 0,
          last_reported_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('custom_themes table created successfully');
    } else {
      console.log('custom_themes table exists, checking for missing columns...');
      
      // Check for and add missing columns
      const columnsToCheck = [
        { name: 'background_color', type: 'VARCHAR(50)', default: "'#FFFFFF'" },
        { name: 'text_color', type: 'VARCHAR(50)', default: "'#333333'" },
        { name: 'primary_color', type: 'VARCHAR(50)', default: "'#6200EE'" },
        { name: 'secondary_color', type: 'VARCHAR(50)', default: "'#03DAC6'" },
        { name: 'accent_color', type: 'VARCHAR(50)', default: "'#BB86FC'" },
        { name: 'is_default', type: 'BOOLEAN', default: 'false' },
        { name: 'is_dark', type: 'BOOLEAN', default: 'false' },
        { name: 'moderation_status', type: 'VARCHAR(50)', default: "'approved'" },
        { name: 'moderation_notes', type: 'TEXT', default: 'NULL' },
        { name: 'moderation_date', type: 'TIMESTAMPTZ', default: 'NULL' },
        { name: 'reported_count', type: 'INTEGER', default: '0' },
        { name: 'last_reported_at', type: 'TIMESTAMPTZ', default: 'NULL' }
      ];
      
      for (const column of columnsToCheck) {
        const columnCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'custom_themes'
            AND column_name = $1
          );
        `, [column.name]);
        
        if (!columnCheck.rows[0].exists) {
          console.log(`Adding missing column ${column.name} to custom_themes table...`);
          await client.query(`
            ALTER TABLE custom_themes
            ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default};
          `);
          console.log(`Column ${column.name} added successfully`);
        }
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('custom_themes table fix completed successfully');
    
  } catch (err) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error fixing custom_themes table:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run the fix
fixCustomThemes()
  .then(() => {
    console.log('Successfully fixed custom_themes table structure');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to fix custom_themes table:', err);
    process.exit(1);
  }); 