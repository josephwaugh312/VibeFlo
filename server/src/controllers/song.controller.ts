import { Request, Response } from 'express';
import pool from '../config/db';

/**
 * Search songs by title, artist, or album
 */
export const searchSongs = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchTerm = `%${query}%`;
    
    const songs = await pool.query(
      `SELECT * FROM songs
       WHERE title ILIKE $1
       OR artist ILIKE $1
       OR album ILIKE $1
       ORDER BY title ASC
       LIMIT 20`,
      [searchTerm]
    );

    res.json(songs.rows);
  } catch (error) {
    console.error('Error searching songs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get a song by ID
 */
export const getSongById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const song = await pool.query('SELECT * FROM songs WHERE id = $1', [id]);
    
    if (song.rows.length === 0) {
      return res.status(404).json({ message: 'Song not found' });
    }

    res.json(song.rows[0]);
  } catch (error) {
    console.error('Error fetching song:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new song
 */
export const createSong = async (req: Request, res: Response) => {
  try {
    const { title, artist, album, duration, image_url } = req.body;
    
    if (!title || !artist) {
      return res.status(400).json({ message: 'Title and artist are required' });
    }

    const newSong = await pool.query(
      'INSERT INTO songs (title, artist, album, duration, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, artist, album || null, duration || null, image_url || null]
    );

    res.status(201).json(newSong.rows[0]);
  } catch (error) {
    console.error('Error creating song:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 