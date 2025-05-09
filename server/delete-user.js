require('dotenv').config();
const { Pool } = require('pg');

const email = 'joseph.waugh312@gmail.com'; // The email of the account you want to delete

console.log('Attempting to delete user account for testing...');
console.log(`Target email: ${email}`);
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
    
    // First get the user ID
    const userResult = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      console.log(`No user found with email: ${email}`);
      await client.query('ROLLBACK');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log(`Found user with ID: ${userId}`);
    
    // Delete related records first to maintain referential integrity
    // Custom themes
    console.log('Deleting custom themes...');
    await client.query('DELETE FROM custom_themes WHERE created_by = $1', [userId]);
    
    // Playlists and playlist songs
    console.log('Deleting playlist songs...');
    const playlistsResult = await client.query('SELECT id FROM playlists WHERE user_id = $1', [userId]);
    const playlistIds = playlistsResult.rows.map(row => row.id);
    
    if (playlistIds.length > 0) {
      await client.query('DELETE FROM playlist_songs WHERE playlist_id = ANY($1)', [playlistIds]);
    }
    
    console.log('Deleting playlists...');
    await client.query('DELETE FROM playlists WHERE user_id = $1', [userId]);
    
    // Pomodoro sessions and stats
    console.log('Deleting pomodoro sessions...');
    await client.query('DELETE FROM pomodoro_sessions WHERE user_id = $1', [userId]);
    
    console.log('Deleting pomodoro stats...');
    await client.query('DELETE FROM pomodoro_stats WHERE user_id = $1', [userId]);
    
    // User settings
    console.log('Deleting user settings...');
    await client.query('DELETE FROM user_settings WHERE user_id = $1', [userId]);
    
    // Finally delete the user
    console.log('Deleting user account...');
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log(`Successfully deleted user with email: ${email}`);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting user:', err);
  } finally {
    client.release();
    pool.end();
  }
}

deleteUser(); 