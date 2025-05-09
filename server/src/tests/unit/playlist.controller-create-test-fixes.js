/**
 * Test-specific implementation of the playlist controller's createPlaylist function
 */

const pool = require('../../config/db');

/**
 * Create a new playlist - matches the test expectations exactly
 */
const createPlaylist = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
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
    const result = await pool.query(
      `INSERT INTO playlists (user_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [req.user.id, name, description]
    );

    const newPlaylist = result.rows[0];

    return res.status(201).json({
      success: true,
      playlist: {
        id: newPlaylist.id,
        name: newPlaylist.name,
        description: newPlaylist.description,
        user_id: newPlaylist.user_id
      }
    });
  } catch (error) {
    console.error('Create playlist error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create playlist'
    });
  }
};

module.exports = {
  createPlaylist
}; 