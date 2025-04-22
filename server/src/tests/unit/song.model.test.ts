import { createSong, getSongById, searchSongs, getSongsByPlaylistId } from '../../models/Song';
import pool from '../../config/db';

// Mock the database pool
jest.mock('../../config/db', () => {
  return {
    query: jest.fn()
  };
});

// Mock console.error to prevent test output noise
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Song Model', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSong', () => {
    it('should create a new song with valid data', async () => {
      // Mock data
      const songData = {
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        duration: 180,
        image_url: 'https://example.com/image.jpg'
      };

      // Mock database response
      const mockResult = {
        rows: [{
          id: 1,
          ...songData,
          created_at: new Date()
        }],
        rowCount: 1
      };

      // Setup mock for pool.query
      (pool.query as jest.Mock).mockResolvedValueOnce(mockResult);

      // Execute the function
      const result = await createSong(songData);

      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO songs (title, artist, album, duration, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        ['Test Song', 'Test Artist', 'Test Album', 180, 'https://example.com/image.jpg']
      );

      // Verify result
      expect(result).toEqual(mockResult.rows[0]);
    });

    it('should throw error when database query fails', async () => {
      // Mock data
      const songData = {
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        duration: 180,
        image_url: 'https://example.com/image.jpg'
      };

      // Setup mock for pool.query to throw error
      const dbError = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Execute and verify function throws error
      await expect(createSong(songData)).rejects.toThrow('Database error');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSongById', () => {
    it('should return song when found by id', async () => {
      // Mock data
      const songId = 1;
      const mockSong = {
        id: songId,
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        duration: 180,
        image_url: 'https://example.com/image.jpg'
      };

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockSong],
        rowCount: 1
      });

      // Execute the function
      const result = await getSongById(songId);

      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM songs WHERE id = $1',
        [songId]
      );

      // Verify result
      expect(result).toEqual(mockSong);
    });

    it('should return undefined when song not found by id', async () => {
      // Mock data
      const songId = 999;

      // Mock database response with empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Execute the function
      const result = await getSongById(songId);

      // Verify database was queried
      expect(pool.query).toHaveBeenCalledTimes(1);

      // Verify result is undefined (null in this case since the function returns rows[0] which would be undefined)
      expect(result).toBeUndefined();
    });

    it('should throw error when database query fails', async () => {
      // Setup mock for pool.query to throw error
      const dbError = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Execute and verify function throws error
      await expect(getSongById(1)).rejects.toThrow('Database error');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('searchSongs', () => {
    it('should return songs that match the search term', async () => {
      // Mock data
      const searchTerm = 'test';
      const mockSongs = [
        {
          id: 1,
          title: 'Test Song 1',
          artist: 'Test Artist',
          album: 'Test Album',
          duration: 180,
          image_url: 'https://example.com/image1.jpg'
        },
        {
          id: 2,
          title: 'Test Song 2',
          artist: 'Another Artist',
          album: 'Another Album',
          duration: 240,
          image_url: 'https://example.com/image2.jpg'
        }
      ];

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockSongs,
        rowCount: 2
      });

      // Execute the function
      const result = await searchSongs(searchTerm);

      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM songs'),
        [`%${searchTerm}%`]
      );

      // Verify result
      expect(result).toEqual(mockSongs);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no songs match the search term', async () => {
      // Mock data
      const searchTerm = 'nonexistent';

      // Mock database response with empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Execute the function
      const result = await searchSongs(searchTerm);

      // Verify database was queried
      expect(pool.query).toHaveBeenCalledTimes(1);

      // Verify result is an empty array
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should throw error when database query fails', async () => {
      // Setup mock for pool.query to throw error
      const dbError = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Execute and verify function throws error
      await expect(searchSongs('test')).rejects.toThrow('Database error');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSongsByPlaylistId', () => {
    it('should return songs associated with the playlist id', async () => {
      // Mock data
      const playlistId = 1;
      const mockSongs = [
        {
          id: 1,
          title: 'Playlist Song 1',
          artist: 'Test Artist',
          album: 'Test Album',
          duration: 180,
          image_url: 'https://example.com/image1.jpg'
        },
        {
          id: 2,
          title: 'Playlist Song 2',
          artist: 'Another Artist',
          album: 'Another Album',
          duration: 240,
          image_url: 'https://example.com/image2.jpg'
        }
      ];

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockSongs,
        rowCount: 2
      });

      // Execute the function
      const result = await getSongsByPlaylistId(playlistId);

      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT s.* FROM songs s'),
        [playlistId]
      );

      // Verify result
      expect(result).toEqual(mockSongs);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no songs are associated with the playlist id', async () => {
      // Mock data
      const playlistId = 999;

      // Mock database response with empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Execute the function
      const result = await getSongsByPlaylistId(playlistId);

      // Verify database was queried
      expect(pool.query).toHaveBeenCalledTimes(1);

      // Verify result is an empty array
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should throw error when database query fails', async () => {
      // Setup mock for pool.query to throw error
      const dbError = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Execute and verify function throws error
      await expect(getSongsByPlaylistId(1)).rejects.toThrow('Database error');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });
}); 