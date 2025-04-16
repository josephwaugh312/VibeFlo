import { Pool } from 'pg';

export async function cleanupTestDatabase(pool: Pool) {
  try {
    // Drop tables in reverse order of dependencies
    await pool.query('DROP TABLE IF EXISTS themes CASCADE');
    await pool.query('DROP TABLE IF EXISTS verification_tokens CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');

    console.log('Test database cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up test database:', error);
    throw error;
  }
} 