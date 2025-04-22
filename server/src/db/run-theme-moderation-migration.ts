import pool from '../config/db';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Add moderation columns to custom_themes table
    await client.query(`
      ALTER TABLE custom_themes
      ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
      ADD COLUMN IF NOT EXISTS moderation_notes TEXT,
      ADD COLUMN IF NOT EXISTS moderation_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS reported_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_reported_at TIMESTAMP
    `);

    await client.query('COMMIT');
    console.log('Theme moderation migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error running theme moderation migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 