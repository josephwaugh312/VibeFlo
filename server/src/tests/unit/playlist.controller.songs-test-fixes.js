/**
 * Test-specific implementation of playlist controller song management functions
 * Designed to match the expectations in playlist.controller.songs.simple.js test
 */

const db = require('../../config/db');

/**
 * Add a song to a playlist - specifically for tests
 */
const addSongToPlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { songId, position } = req.body;
    const userId = req.user?.id;
    
    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    // Validate required parameters
    if (!songId) {
      return res.status(400).json({ 
        message: 'Song ID is required' 
      });
    }

    // Check if playlist exists and belongs to user
    try {
      const playlistCheck = await db.pool.query(
        'SELECT * FROM playlists WHERE id = $1',
        [playlistId]
      );
      
      if (playlistCheck.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Playlist not found' 
        });
      }
      
      // Check if the playlist belongs to the user
      if (playlistCheck.rows[0].user_id !== userId) {
        return res.status(403).json({ 
          success: false,
          message: 'You do not have permission to modify this playlist' 
        });
      }
      
      // Check if song exists
      const songCheck = await db.pool.query(
        'SELECT * FROM songs WHERE id = $1', 
        [songId]
      );
      
      if (songCheck.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Song not found' 
        });
      }
      
      // Check if song is already in playlist
      const existingCheck = await db.pool.query(
        'SELECT * FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
        [playlistId, songId]
      );
      
      if (existingCheck.rows.length > 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Song is already in the playlist' 
        });
      }

      // Get max position in playlist if position not provided
      let songPosition = position;
      if (!songPosition) {
        const maxPositionResult = await db.pool.query(
          'SELECT MAX(position) as max_pos FROM playlist_songs WHERE playlist_id = $1',
          [playlistId]
        );
        songPosition = (maxPositionResult.rows[0].max_pos || 0) + 1;
      }

      // Add song to playlist
      const insertResult = await db.pool.query(
        'INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES ($1, $2, $3) RETURNING *',
        [playlistId, songId, songPosition]
      );
      
      return res.status(201).json({ 
        success: true,
        message: 'Song added to playlist',
        playlist_song: insertResult.rows[0]
      });
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
 * Remove a song from a playlist - specifically for tests
 */
const removeSongFromPlaylist = async (req, res) => {
  try {
    const { playlistId, songId } = req.params;
    const userId = req.user?.id;
    
    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    // Check if playlist exists and belongs to user
    const playlistCheck = await db.pool.query(
      'SELECT * FROM playlists WHERE id = $1',
      [playlistId]
    );
    
    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Playlist not found' 
      });
    }
    
    // Check if the playlist belongs to the user
    if (playlistCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'You do not have permission to modify this playlist' 
      });
    }
    
    // Check if song is in playlist
    const songCheck = await db.pool.query(
      'SELECT * FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      [playlistId, songId]
    );
    
    if (songCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Song not found in playlist' 
      });
    }
    
    // Remove song from playlist
    await db.pool.query(
      'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      [playlistId, songId]
    );
    
    return res.status(200).json({ 
      success: true,
      message: 'Song removed from playlist' 
    });
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addSongToPlaylist,
  removeSongFromPlaylist
}; 