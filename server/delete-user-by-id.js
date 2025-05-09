require('dotenv').config();
const { Pool } = require('pg');

const userId = 'a41d2449-3e99-4490-a776-c106cb653e59'; // The ID of the account you want to delete

console.log('Attempting to delete user account for testing...');
console.log(`Target user ID: ${userId}`);
console.log('Using DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Render PostgreSQL
});

async function deleteUser() {
  const client = await pool.connect();
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Verify the user exists
    const userResult = await client.query('SELECT id, email, username FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      console.log(`No user found with ID: ${userId}`);
      await client.query('ROLLBACK');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`Found user: ${JSON.stringify(user)}`);
    
    // Delete user-related data safely
    try {
      console.log('Checking for custom_themes table...');
      const hasCustomThemesCreatedBy = await checkColumnExists('custom_themes', 'created_by');
      if (hasCustomThemesCreatedBy) {
        console.log('Deleting custom themes...');
        await client.query('DELETE FROM custom_themes WHERE created_by = $1', [userId]);
      } else {
        console.log('Skipping custom_themes (created_by column not found)');
      }
    } catch (err) {
      console.log('Error handling custom_themes:', err.message);
    }
    
    try {
      // Playlists and playlist songs
      console.log('Deleting playlist songs...');
      const playlistsResult = await client.query('SELECT id FROM playlists WHERE user_id = $1', [userId]);
      const playlistIds = playlistsResult.rows.map(row => row.id);
      
      if (playlistIds.length > 0) {
        await client.query('DELETE FROM playlist_songs WHERE playlist_id = ANY($1)', [playlistIds]);
      }
      
      console.log('Deleting playlists...');
      await client.query('DELETE FROM playlists WHERE user_id = $1', [userId]);
    } catch (err) {
      console.log('Error handling playlists:', err.message);
    }
    
    try {
      // Pomodoro sessions and stats
      console.log('Deleting pomodoro sessions...');
      await client.query('DELETE FROM pomodoro_sessions WHERE user_id = $1', [userId]);
    } catch (err) {
      console.log('Error handling pomodoro_sessions:', err.message);
    }
    
    try {
      console.log('Deleting pomodoro stats...');
      await client.query('DELETE FROM pomodoro_stats WHERE user_id = $1', [userId]);
    } catch (err) {
      console.log('Error handling pomodoro_stats:', err.message);
    }
    
    try {
      // User settings
      console.log('Deleting user settings...');
      await client.query('DELETE FROM user_settings WHERE user_id = $1', [userId]);
    } catch (err) {
      console.log('Error handling user_settings:', err.message);
    }
    
    // Finally delete the user
    console.log('Deleting user account...');
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log(`Successfully deleted user with ID: ${userId}`);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting user:', err);
  } finally {
    client.release();
    pool.end();
  }
}

// Helper function to check if a column exists in a table
async function checkColumnExists(tableName, columnName) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 
      AND column_name = $2
    `, [tableName, columnName]);
    
    return result.rows.length > 0;
  } finally {
    client.release();
  }
}

deleteUser(); 