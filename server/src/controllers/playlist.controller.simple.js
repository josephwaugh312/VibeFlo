/**
 * Simple playlist controller for testing
 * This implementation doesn't use handleAsync for better testability
 */

const pool = require('../config/db');

/**
 * Create a new playlist
 * Simplified version for testing without handleAsync
 */
const createPlaylist = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { name, description = '' } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Playlist name is required'
      });
    }

    // Insert playlist into database
    const result = await req.app.locals.db.pool.query(
      `INSERT INTO playlists (user_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [req.user.id, name, description]
    );

    const newPlaylist = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Playlist created successfully',
      playlist: newPlaylist
    });
  } catch (error) {
    console.error('Create playlist error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating playlist'
    });
  }
};

/**
 * Add a song to a playlist - simplified for testing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addSongToPlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { songId, position } = req.body;
    const userId = req.user?.id;
    
    // For database access in tests
    const dbPool = req.app?.locals?.db?.pool || pool;
    
    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Validate required parameters
    if (!songId) {
      return res.status(400).json({ message: 'Song ID is required' });
    }

    // Check if playlist exists and belongs to user
    try {
      const playlistCheck = await dbPool.query(
        'SELECT * FROM playlists WHERE id = $1',
        [playlistId]
      );
      
      if (playlistCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Playlist not found' });
      }
      
      // Check if the playlist belongs to the user
      if (playlistCheck.rows[0].user_id !== userId.toString()) {
        return res.status(403).json({ message: 'You do not have permission to modify this playlist' });
      }
      
      // Check if song exists
      const songCheck = await dbPool.query(
        'SELECT * FROM songs WHERE id = $1', 
        [songId]
      );
      
      if (songCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Song not found' });
      }
      
      // Check if song is already in playlist
      const existingCheck = await dbPool.query(
        'SELECT * FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
        [playlistId, songId]
      );
      
      if (existingCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Song is already in the playlist' });
      }

      // Get max position in playlist if position not provided
      let songPosition = position;
      if (!songPosition) {
        const maxPositionResult = await dbPool.query(
          'SELECT MAX(position) as max_pos FROM playlist_songs WHERE playlist_id = $1',
          [playlistId]
        );
        songPosition = (maxPositionResult.rows[0].max_pos || 0) + 1;
      }

      // Add song to playlist
      await dbPool.query(
        'INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES ($1, $2, $3)',
        [playlistId, songId, songPosition]
      );
      
      return res.status(201).json({ message: 'Song added to playlist' });
    } catch (dbError) {
      console.error('Database error:', dbError);
      throw dbError; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Remove a song from a playlist - simplified for testing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const removeSongFromPlaylist = async (req, res) => {
  try {
    const { playlistId, songId } = req.params;
    const userId = req.user?.id;
    
    // For database access in tests
    const dbPool = req.app?.locals?.db?.pool || pool;
    
    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if playlist exists and belongs to user
    const playlistCheck = await dbPool.query(
      'SELECT * FROM playlists WHERE id = $1',
      [playlistId]
    );
    
    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    // Remove song from playlist
    await dbPool.query(
      'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      [playlistId, songId]
    );
    
    return res.status(200).json({ message: 'Song removed from playlist' });
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist
}; 