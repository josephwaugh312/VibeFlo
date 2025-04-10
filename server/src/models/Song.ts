import pool from '../config/db';

interface Song {
  id?: number;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  image_url?: string;
}

export const createSong = async (song: Song) => {
  const { title, artist, album, duration, image_url } = song;
  const query = 'INSERT INTO songs (title, artist, album, duration, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *';
  const values = [title, artist, album, duration, image_url];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export const getSongById = async (id: number) => {
  const query = 'SELECT * FROM songs WHERE id = $1';
  
  try {
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export const searchSongs = async (searchTerm: string) => {
  const query = `
    SELECT * FROM songs 
    WHERE title ILIKE $1 
    OR artist ILIKE $1 
    OR album ILIKE $1
    ORDER BY title ASC
  `;
  const value = `%${searchTerm}%`;
  
  try {
    const result = await pool.query(query, [value]);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

export const getSongsByPlaylistId = async (playlistId: number) => {
  const query = `
    SELECT s.* FROM songs s
    JOIN playlist_songs ps ON s.id = ps.song_id
    WHERE ps.playlist_id = $1
    ORDER BY ps.position ASC
  `;
  
  try {
    const result = await pool.query(query, [playlistId]);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

export default {
  createSong,
  getSongById,
  searchSongs,
  getSongsByPlaylistId
}; 