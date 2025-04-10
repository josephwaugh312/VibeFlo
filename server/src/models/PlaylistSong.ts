import pool from '../config/db';

interface PlaylistSong {
  playlist_id: number;
  song_id: number;
  position?: number;
}

export const addSongToPlaylist = async (playlistSong: PlaylistSong) => {
  const { playlist_id, song_id, position } = playlistSong;
  
  // Get the highest position if not provided
  let pos = position;
  if (!pos) {
    const posQuery = 'SELECT MAX(position) as max_pos FROM playlist_songs WHERE playlist_id = $1';
    const posResult = await pool.query(posQuery, [playlist_id]);
    pos = (posResult.rows[0]?.max_pos || 0) + 1;
  }
  
  const query = 'INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES ($1, $2, $3) RETURNING *';
  const values = [playlist_id, song_id, pos];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export const removeSongFromPlaylist = async (playlist_id: number, song_id: number) => {
  const query = 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING *';
  
  try {
    const result = await pool.query(query, [playlist_id, song_id]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export const updateSongPosition = async (playlist_id: number, song_id: number, position: number) => {
  const query = 'UPDATE playlist_songs SET position = $3 WHERE playlist_id = $1 AND song_id = $2 RETURNING *';
  
  try {
    const result = await pool.query(query, [playlist_id, song_id, position]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export const getPlaylistSongs = async (playlist_id: number) => {
  const query = 'SELECT * FROM playlist_songs WHERE playlist_id = $1 ORDER BY position ASC';
  
  try {
    const result = await pool.query(query, [playlist_id]);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

export default {
  addSongToPlaylist,
  removeSongFromPlaylist,
  updateSongPosition,
  getPlaylistSongs
}; 