import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runVerificationMigration() {
  const client = await pool.connect();
  try {
    // Read and execute the migration file
    const migration = fs.readFileSync(
      path.join(__dirname, '..', 'migrations', '004_create_verification_tokens.sql'),
      'utf8'
    );
    
    // Begin transaction
    await client.query('BEGIN');
    
    console.log('Running verification tokens migration...');
    
    // Execute the migration
    await client.query(migration);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Migration completed successfully!');
  } catch (err) {
    // Rollback transaction in case of error
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    // Release the client back to the pool
    client.release();
    process.exit(0);
  }
}

// Run the migration
runVerificationMigration(); 