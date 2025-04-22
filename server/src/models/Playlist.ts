import pool from '../config/db';

interface Playlist {
  id?: number;
  name: string;
  description?: string;
  user_id: number;
  created_at?: Date;
}

export const createPlaylist = async (playlist: Playlist) => {
  const { name, description, user_id } = playlist;
  const query = 'INSERT INTO playlists (name, description, user_id) VALUES ($1, $2, $3) RETURNING *';
  const values = [name, description, user_id];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export const getPlaylistById = async (id: number) => {
  const query = 'SELECT * FROM playlists WHERE id = $1';
  
  try {
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export const getPlaylistsByUserId = async (userId: number) => {
  const query = 'SELECT * FROM playlists WHERE user_id = $1 ORDER BY created_at DESC';
  
  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

export const updatePlaylist = async (id: number, playlist: Partial<Playlist>) => {
  const { name, description } = playlist;
  const query = 'UPDATE playlists SET name = $1, description = $2 WHERE id = $3 RETURNING *';
  const values = [name, description, id];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export const deletePlaylist = async (id: number) => {
  const query = 'DELETE FROM playlists WHERE id = $1 RETURNING *';
  
  try {
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export default {
  createPlaylist,
  getPlaylistById,
  getPlaylistsByUserId,
  updatePlaylist,
  deletePlaylist
}; 