import { addSongToPlaylist, removeSongFromPlaylist, updateSongPosition, getPlaylistSongs } from '../../models/PlaylistSong';
import pool from '../../config/db';

// Mock the database pool
jest.mock('../../config/db', () => {
  return {
    query: jest.fn()
  };
});

// Mock console.error to prevent test output noise
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('PlaylistSong Model', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addSongToPlaylist', () => {
    it('should add a song to playlist with specified position', async () => {
      // Mock data
      const playlistSongData = {
        playlist_id: 1,
        song_id: 2,
        position: 3
      };

      // Mock database response
      const mockResult = {
        rows: [{
          ...playlistSongData,
          created_at: new Date()
        }],
        rowCount: 1
      };

      // Setup mock for pool.query
      (pool.query as jest.Mock).mockResolvedValueOnce(mockResult);

      // Execute the function
      const result = await addSongToPlaylist(playlistSongData);

      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES ($1, $2, $3) RETURNING *',
        [1, 2, 3]
      );

      // Verify result
      expect(result).toEqual(mockResult.rows[0]);
    });

    it('should add a song to playlist with calculated position when position not provided', async () => {
      // Mock data
      const playlistSongData = {
        playlist_id: 1,
        song_id: 2
      };

      // Mock database responses
      const posQueryResult = {
        rows: [{ max_pos: 5 }],
        rowCount: 1
      };

      const insertResult = {
        rows: [{
          playlist_id: 1,
          song_id: 2,
          position: 6, // max_pos + 1
          created_at: new Date()
        }],
        rowCount: 1
      };

      // Setup mocks for pool.query calls
      (pool.query as jest.Mock).mockResolvedValueOnce(posQueryResult); // For position query
      (pool.query as jest.Mock).mockResolvedValueOnce(insertResult);   // For insert query

      // Execute the function
      const result = await addSongToPlaylist(playlistSongData);

      // Verify position query was called
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT MAX(position) as max_pos FROM playlist_songs WHERE playlist_id = $1',
        [1]
      );

      // Verify insert query was called with correct position
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES ($1, $2, $3) RETURNING *',
        [1, 2, 6]
      );

      // Verify result
      expect(result).toEqual(insertResult.rows[0]);
    });

    it('should use position 1 when no songs exist in playlist', async () => {
      // Mock data
      const playlistSongData = {
        playlist_id: 1,
        song_id: 2
      };

      // Mock database responses
      const posQueryResult = {
        rows: [{ max_pos: null }], // No songs in playlist
        rowCount: 1
      };

      const insertResult = {
        rows: [{
          playlist_id: 1,
          song_id: 2,
          position: 1, // Should default to 1
          created_at: new Date()
        }],
        rowCount: 1
      };

      // Setup mocks for pool.query calls
      (pool.query as jest.Mock).mockResolvedValueOnce(posQueryResult); // For position query
      (pool.query as jest.Mock).mockResolvedValueOnce(insertResult);   // For insert query

      // Execute the function
      const result = await addSongToPlaylist(playlistSongData);

      // Verify position query was called
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT MAX(position)'),
        [1]
      );

      // Verify insert query was called with position 1
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO playlist_songs'),
        [1, 2, 1]
      );

      // Verify result
      expect(result).toEqual(insertResult.rows[0]);
    });

    it('should throw error when database query fails', async () => {
      // Mock data
      const playlistSongData = {
        playlist_id: 1,
        song_id: 2,
        position: 3
      };

      // Setup mock for pool.query to throw error
      const dbError = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Execute and verify function throws error
      await expect(addSongToPlaylist(playlistSongData)).rejects.toThrow('Database error');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeSongFromPlaylist', () => {
    it('should remove a song from playlist', async () => {
      // Mock data
      const playlistId = 1;
      const songId = 2;
      const mockRemovedSong = {
        playlist_id: playlistId,
        song_id: songId,
        position: 3
      };

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockRemovedSong],
        rowCount: 1
      });

      // Execute the function
      const result = await removeSongFromPlaylist(playlistId, songId);

      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING *',
        [playlistId, songId]
      );

      // Verify result
      expect(result).toEqual(mockRemovedSong);
    });

    it('should return undefined when song not found in playlist', async () => {
      // Mock data
      const playlistId = 1;
      const songId = 999;

      // Mock database response with empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Execute the function
      const result = await removeSongFromPlaylist(playlistId, songId);

      // Verify database was queried
      expect(pool.query).toHaveBeenCalledTimes(1);

      // Verify result is undefined
      expect(result).toBeUndefined();
    });

    it('should throw error when database query fails', async () => {
      // Setup mock for pool.query to throw error
      const dbError = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Execute and verify function throws error
      await expect(removeSongFromPlaylist(1, 2)).rejects.toThrow('Database error');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateSongPosition', () => {
    it('should update song position in playlist', async () => {
      // Mock data
      const playlistId = 1;
      const songId = 2;
      const newPosition = 5;
      const mockUpdatedSong = {
        playlist_id: playlistId,
        song_id: songId,
        position: newPosition
      };

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockUpdatedSong],
        rowCount: 1
      });

      // Execute the function
      const result = await updateSongPosition(playlistId, songId, newPosition);

      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE playlist_songs SET position = $3 WHERE playlist_id = $1 AND song_id = $2 RETURNING *',
        [playlistId, songId, newPosition]
      );

      // Verify result
      expect(result).toEqual(mockUpdatedSong);
    });

    it('should return undefined when song not found in playlist', async () => {
      // Mock data
      const playlistId = 1;
      const songId = 999;
      const newPosition = 5;

      // Mock database response with empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Execute the function
      const result = await updateSongPosition(playlistId, songId, newPosition);

      // Verify database was queried
      expect(pool.query).toHaveBeenCalledTimes(1);

      // Verify result is undefined
      expect(result).toBeUndefined();
    });

    it('should throw error when database query fails', async () => {
      // Setup mock for pool.query to throw error
      const dbError = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Execute and verify function throws error
      await expect(updateSongPosition(1, 2, 3)).rejects.toThrow('Database error');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPlaylistSongs', () => {
    it('should return songs in playlist', async () => {
      // Mock data
      const playlistId = 1;
      const mockPlaylistSongs = [
        {
          playlist_id: playlistId,
          song_id: 1,
          position: 1
        },
        {
          playlist_id: playlistId,
          song_id: 2,
          position: 2
        },
        {
          playlist_id: playlistId,
          song_id: 3,
          position: 3
        }
      ];

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockPlaylistSongs,
        rowCount: 3
      });

      // Execute the function
      const result = await getPlaylistSongs(playlistId);

      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM playlist_songs WHERE playlist_id = $1 ORDER BY position ASC',
        [playlistId]
      );

      // Verify result
      expect(result).toEqual(mockPlaylistSongs);
      expect(result.length).toBe(3);
    });

    it('should return empty array when no songs in playlist', async () => {
      // Mock data
      const playlistId = 999;

      // Mock database response with empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Execute the function
      const result = await getPlaylistSongs(playlistId);

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
      await expect(getPlaylistSongs(1)).rejects.toThrow('Database error');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });
}); 