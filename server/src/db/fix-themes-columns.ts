import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
console.log('Starting database connection script...');
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

/**
 * Fix the themes table by adding missing columns
 */
async function fixThemesColumns() {
  console.log('Acquiring database client from pool...');
  let client;
  
  try {
    client = await pool.connect();
    console.log('Successfully connected to database!');
    
    console.log('Starting fix for themes table columns...');
    
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
      console.log('Themes table does not exist, creating it from scratch...');
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
    } else {
      console.log('Themes table exists, checking for missing columns...');
      
      // Check for and add missing columns
      const columnsToCheck = [
        { name: 'background_color', type: 'VARCHAR(50)', default: "'#FFFFFF'" },
        { name: 'text_color', type: 'VARCHAR(50)', default: "'#333333'" },
        { name: 'primary_color', type: 'VARCHAR(50)', default: "'#6200EE'" },
        { name: 'secondary_color', type: 'VARCHAR(50)', default: "'#03DAC6'" },
        { name: 'accent_color', type: 'VARCHAR(50)', default: "'#BB86FC'" },
        { name: 'is_dark', type: 'BOOLEAN', default: 'false' },
        { name: 'is_public', type: 'BOOLEAN', default: 'true' },
        { name: 'is_default', type: 'BOOLEAN', default: 'false' }
      ];
      
      for (const column of columnsToCheck) {
        console.log(`Checking if column ${column.name} exists in themes table...`);
        const columnCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'themes'
            AND column_name = $1
          );
        `, [column.name]);
        
        if (!columnCheck.rows[0].exists) {
          console.log(`Adding missing column ${column.name} to themes table...`);
          await client.query(`
            ALTER TABLE themes
            ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default};
          `);
          console.log(`Column ${column.name} added successfully`);
        } else {
          console.log(`Column ${column.name} already exists in themes table`);
        }
      }
      
      // Check if the primary key is UUID or some other type
      console.log('Checking primary key type...');
      const pkTypeCheck = await client.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'themes'
        AND column_name = 'id'
      `);
      
      if (pkTypeCheck.rows.length > 0) {
        console.log(`Primary key data type: ${pkTypeCheck.rows[0].data_type}`);
        
        if (pkTypeCheck.rows[0].data_type !== 'uuid') {
          console.log(`Primary key is of type ${pkTypeCheck.rows[0].data_type}, need to update table structure...`);
          console.log('Creating new themes table with correct structure...');
          
          // Create a new table with the correct structure
          await client.query(`
            CREATE TABLE themes_new (
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
          
          // Drop the old table and rename the new one
          await client.query(`DROP TABLE themes;`);
          await client.query(`ALTER TABLE themes_new RENAME TO themes;`);
          
          console.log('Themes table recreated with correct structure');
        } else {
          console.log('Primary key is already UUID type, no need to restructure table');
        }
      } else {
        console.log('No primary key information found, this is unexpected');
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Themes table column fix completed successfully');
    
  } catch (err) {
    // Rollback the transaction in case of error
    console.error('Error during database operations:', err);
    if (client) {
      console.log('Rolling back transaction due to error');
      await client.query('ROLLBACK');
    }
    console.error('Error fixing themes table columns:', err);
    throw err;
  } finally {
    if (client) {
      console.log('Releasing database client back to pool');
      client.release();
    }
  }
}

// Run the fix
fixThemesColumns()
  .then(() => {
    console.log('Successfully fixed themes table columns');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to fix themes table columns:', err);
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