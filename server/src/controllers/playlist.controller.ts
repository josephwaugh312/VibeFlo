import { Request, Response } from 'express';
import pool from '../config/db';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * Get all playlists for the current user
 */
export const getUserPlaylists = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const playlists = await pool.query(
      'SELECT * FROM playlists WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json(playlists.rows);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get a playlist by ID
 */
export const getPlaylistById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get playlist
    const playlist = await pool.query(
      'SELECT * FROM playlists WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (playlist.rows.length === 0) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    const playlistData = playlist.rows[0];

    // Get songs in the playlist
    const songs = await pool.query(
      `SELECT s.* FROM songs s
       JOIN playlist_songs ps ON s.id = ps.song_id
       WHERE ps.playlist_id = $1
       ORDER BY ps.position ASC`,
      [id]
    );

    // Add songs to the playlist object
    playlistData.tracks = songs.rows;

    res.json(playlistData);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new playlist
 */
export const createPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, tracks } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Playlist name is required' });
    }

    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Create the playlist
      const playlistResult = await client.query(
        'INSERT INTO playlists (name, description, user_id) VALUES ($1, $2, $3) RETURNING *',
        [name, description || null, userId]
      );
      
      const newPlaylist = playlistResult.rows[0];
      
      // 2. If tracks are provided, add them to the playlist
      if (tracks && Array.isArray(tracks) && tracks.length > 0) {
        console.log(`Adding ${tracks.length} tracks to playlist ${newPlaylist.id}`);
        
        // Add each track to the playlist
        for (let i = 0; i < tracks.length; i++) {
          const track = tracks[i];
          
          // Check for required fields
          if (!track.title || !track.artist) {
            console.warn('Skipping track without title or artist:', track);
            continue;
          }
          
          console.log(`Processing track: ${track.title} by ${track.artist}`);
          
          try {
            // Insert the song into the songs table
            const songResult = await client.query(
              `INSERT INTO songs 
               (title, artist, album, duration, image_url, url, youtube_id, source) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
               RETURNING *`,
              [
                track.title,
                track.artist,
                track.album || null,
                track.duration || null,
                track.artwork || null,
                track.url || null,
                track.youtube_id || null,
                track.source || 'youtube'
              ]
            );
            
            const newSong = songResult.rows[0];
            console.log(`Created song with ID: ${newSong.id}`);
            
            // Add the song to the playlist
            await client.query(
              'INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES ($1, $2, $3)',
              [newPlaylist.id, newSong.id, i + 1]
            );
            
            console.log(`Added song ${newSong.id} to playlist ${newPlaylist.id} at position ${i + 1}`);
          } catch (songError) {
            console.error('Error adding song to playlist:', songError);
            // Continue with the next track instead of failing the whole operation
          }
        }
        
        // Fetch all songs in the playlist to return with the response
        const songsResult = await client.query(
          `SELECT s.* FROM songs s
           JOIN playlist_songs ps ON s.id = ps.song_id
           WHERE ps.playlist_id = $1
           ORDER BY ps.position`,
          [newPlaylist.id]
        );
        
        newPlaylist.tracks = songsResult.rows;
      }
      
      await client.query('COMMIT');
      
      // Return the playlist with tracks
      res.status(201).json(newPlaylist);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a playlist
 */
export const updatePlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, tracks } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if playlist exists and belongs to user
    const playlistCheck = await pool.query(
      'SELECT * FROM playlists WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update playlist basic info
      const updatedPlaylist = await client.query(
        'UPDATE playlists SET name = $1, description = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
        [
          name || playlistCheck.rows[0].name, 
          description !== undefined ? description : playlistCheck.rows[0].description,
          id,
          userId
        ]
      );
      
      const playlist = updatedPlaylist.rows[0];
      
      // If tracks are provided, update the playlist's tracks
      if (tracks && Array.isArray(tracks)) {
        console.log(`Updating playlist ${id} with ${tracks.length} tracks`);
        
        // First, remove all existing playlist_songs entries
        await client.query('DELETE FROM playlist_songs WHERE playlist_id = $1', [id]);
        
        // Then add each track to the playlist
        for (let i = 0; i < tracks.length; i++) {
          const track = tracks[i];
          
          // Skip tracks without required fields
          if (!track.title || !track.artist) {
            console.warn('Skipping track without title or artist:', track);
            continue;
          }
          
          console.log(`Processing track: ${track.title} by ${track.artist}`);
          
          let songId;
          
          // Check if track.id is provided and exists in the database
          if (track.id) {
            try {
              // Try to parse the ID to ensure it's a valid integer
              let trackIdToUse;
              
              // Check if it's a numeric string or number, avoid JavaScript timestamps
              if (typeof track.id === 'string' || typeof track.id === 'number') {
                const numericId = parseInt(String(track.id));
                // Only use IDs that are small enough to be valid PostgreSQL integers
                // PostgreSQL integer max is 2147483647
                if (!isNaN(numericId) && numericId <= 2147483647) {
                  trackIdToUse = numericId;
                }
              }
              
              // Only proceed with ID lookup if we have a valid ID
              if (trackIdToUse) {
                // Try to use the existing song if it exists
                const existingSong = await client.query('SELECT id FROM songs WHERE id = $1', [trackIdToUse]);
                
                if (existingSong.rows.length > 0) {
                  // The song exists, use its ID
                  songId = existingSong.rows[0].id;
                  console.log(`Using existing song with ID: ${songId}`);
                  
                  // Optionally update the song's details
                  await client.query(
                    `UPDATE songs SET 
                     title = $1, artist = $2, album = $3, 
                     duration = $4, image_url = $5, url = $6, 
                     youtube_id = $7, source = $8 
                     WHERE id = $9`,
                    [
                      track.title,
                      track.artist,
                      track.album || null,
                      track.duration || null,
                      track.artwork || track.image_url || null,
                      track.url || null,
                      track.youtube_id || null,
                      track.source || 'youtube',
                      songId
                    ]
                  );
                } else {
                  // The ID doesn't exist, create a new song
                  throw new Error('Song ID not found');
                }
              } else {
                // ID is not valid for PostgreSQL integer field
                throw new Error('Invalid song ID format');
              }
            } catch (idError) {
              // Failed to use existing ID, create a new song
              console.log('Creating new song because:', idError instanceof Error ? idError.message : String(idError));
              const songResult = await client.query(
                `INSERT INTO songs 
                 (title, artist, album, duration, image_url, url, youtube_id, source) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                 RETURNING *`,
                [
                  track.title,
                  track.artist,
                  track.album || null,
                  track.duration || null,
                  track.artwork || track.image_url || null,
                  track.url || null,
                  track.youtube_id || null,
                  track.source || 'youtube'
                ]
              );
              
              songId = songResult.rows[0].id;
              console.log(`Created new song with ID: ${songId}`);
            }
          } else {
            // No ID provided, create a new song
            const songResult = await client.query(
              `INSERT INTO songs 
               (title, artist, album, duration, image_url, url, youtube_id, source) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
               RETURNING *`,
              [
                track.title,
                track.artist,
                track.album || null,
                track.duration || null,
                track.artwork || track.image_url || null,
                track.url || null,
                track.youtube_id || null,
                track.source || 'youtube'
              ]
            );
            
            songId = songResult.rows[0].id;
            console.log(`Created new song with ID: ${songId}`);
          }
          
          // Add the song to the playlist
          await client.query(
            'INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES ($1, $2, $3)',
            [id, songId, i + 1]
          );
          
          console.log(`Added song ${songId} to playlist ${id} at position ${i + 1}`);
        }
      }
      
      // Fetch all songs in the playlist to return with the response
      const songsResult = await client.query(
        `SELECT s.* FROM songs s
         JOIN playlist_songs ps ON s.id = ps.song_id
         WHERE ps.playlist_id = $1
         ORDER BY ps.position`,
        [id]
      );
      
      // Add tracks to the playlist object for the response
      playlist.tracks = songsResult.rows;
      
      await client.query('COMMIT');
      
      // Return the updated playlist with tracks
      res.json(playlist);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a playlist
 */
export const deletePlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if playlist exists and belongs to user
    const playlistCheck = await pool.query(
      'SELECT * FROM playlists WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Delete playlist (will cascade to playlist_songs)
    await pool.query(
      'DELETE FROM playlists WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get songs in a playlist
 */
export const getPlaylistSongs = async (req: AuthRequest, res: Response) => {
  try {
    const { playlistId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if playlist exists and belongs to user
    const playlistCheck = await pool.query(
      'SELECT * FROM playlists WHERE id = $1 AND user_id = $2',
      [playlistId, userId]
    );
    
    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Get songs in the playlist
    const songs = await pool.query(
      `SELECT s.*, ps.position 
       FROM songs s
       JOIN playlist_songs ps ON s.id = ps.song_id
       WHERE ps.playlist_id = $1
       ORDER BY ps.position`,
      [playlistId]
    );

    res.json(songs.rows);
  } catch (error) {
    console.error('Error fetching playlist songs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Add a song to a playlist
 */
export const addSongToPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const { playlistId } = req.params;
    const { songId, position } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!songId) {
      return res.status(400).json({ message: 'Song ID is required' });
    }

    // Check if playlist exists and belongs to user
    const playlistCheck = await pool.query(
      'SELECT * FROM playlists WHERE id = $1 AND user_id = $2',
      [playlistId, userId]
    );
    
    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Check if song exists
    const songCheck = await pool.query('SELECT * FROM songs WHERE id = $1', [songId]);
    
    if (songCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Check if song is already in playlist
    const existingCheck = await pool.query(
      'SELECT * FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      [playlistId, songId]
    );
    
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Song is already in the playlist' });
    }

    // Get max position in playlist if position not provided
    let songPosition = position;
    if (!songPosition) {
      const maxPositionResult = await pool.query(
        'SELECT MAX(position) as max_pos FROM playlist_songs WHERE playlist_id = $1',
        [playlistId]
      );
      songPosition = (maxPositionResult.rows[0].max_pos || 0) + 1;
    }

    // Add song to playlist
    await pool.query(
      'INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES ($1, $2, $3)',
      [playlistId, songId, songPosition]
    );

    res.status(201).json({ message: 'Song added to playlist' });
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Remove a song from a playlist
 */
export const removeSongFromPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const { playlistId, songId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if playlist exists and belongs to user
    const playlistCheck = await pool.query(
      'SELECT * FROM playlists WHERE id = $1 AND user_id = $2',
      [playlistId, userId]
    );
    
    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Remove song from playlist
    await pool.query(
      'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      [playlistId, songId]
    );

    res.json({ message: 'Song removed from playlist' });
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 