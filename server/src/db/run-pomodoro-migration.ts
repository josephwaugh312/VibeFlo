import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// Create a new PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting pomodoro_sessions migration...');
    
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Read the migration SQL
    const migrationPath = path.resolve(__dirname, './migrations/add_task_to_pomodoro_sessions.sql');
    console.log('Reading migration from:', migrationPath);
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    // Check if migration has already been applied
    const checkResult = await client.query(`
      SELECT name FROM migrations WHERE name = 'add_task_to_pomodoro_sessions'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('Migration has already been applied, skipping...');
    } else {
      // Execute the migration
      console.log('Applying migration...');
      await client.query(migration);
      console.log('Migration applied successfully!');
    }
    
    // Verify the task column now exists
    const verifyResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'pomodoro_sessions'
      AND column_name = 'task'
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('Verified: task column exists in pomodoro_sessions table');
    } else {
      console.error('Error: task column could not be verified in pomodoro_sessions table');
    }
    
    console.log('Migration process completed');
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration(); 