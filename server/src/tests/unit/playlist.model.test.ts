import { createPlaylist, getPlaylistById, getPlaylistsByUserId, updatePlaylist, deletePlaylist } from '../../models/Playlist';
import pool from '../../config/db';

// Mock the database pool
jest.mock('../../config/db', () => {
  return {
    query: jest.fn()
  };
});

// Mock console.error to prevent test output noise
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Playlist Model', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPlaylist', () => {
    it('should create a new playlist with valid data', async () => {
      // Mock data
      const playlistData = {
        name: 'Test Playlist',
        description: 'A test playlist description',
        user_id: 1
      };

      // Mock database response
      const mockResult = {
        rows: [{
          id: 1,
          ...playlistData,
          created_at: new Date()
        }],
        rowCount: 1
      };

      // Setup mock for pool.query
      (pool.query as jest.Mock).mockResolvedValueOnce(mockResult);

      // Execute the function
      const result = await createPlaylist(playlistData);

      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO playlists (name, description, user_id) VALUES ($1, $2, $3) RETURNING *',
        ['Test Playlist', 'A test playlist description', 1]
      );

      // Verify result
      expect(result).toEqual(mockResult.rows[0]);
    });

    it('should throw error when database query fails', async () => {
      // Mock data
      const playlistData = {
        name: 'Test Playlist',
        description: 'A test playlist description',
        user_id: 1
      };

      // Setup mock for pool.query to throw error
      const dbError = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Execute and verify function throws error
      await expect(createPlaylist(playlistData)).rejects.toThrow('Database error');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPlaylistById', () => {
    it('should return playlist when found by id', async () => {
      // Mock data
      const playlistId = 1;
      const mockPlaylist = {
        id: playlistId,
        name: 'Test Playlist',
        description: 'A test playlist description',
        user_id: 1,
        created_at: new Date()
      };

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockPlaylist],
        rowCount: 1
      });

      // Execute the function
      const result = await getPlaylistById(playlistId);

      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM playlists WHERE id = $1',
        [playlistId]
      );

      // Verify result
      expect(result).toEqual(mockPlaylist);
    });

    it('should return undefined when playlist not found by id', async () => {
      // Mock data
      const playlistId = 999;

      // Mock database response with empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Execute the function
      const result = await getPlaylistById(playlistId);

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
      await expect(getPlaylistById(1)).rejects.toThrow('Database error');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPlaylistsByUserId', () => {
    it('should return playlists for a user id', async () => {
      // Mock data
      const userId = 1;
      const mockPlaylists = [
        {
          id: 1,
          name: 'Test Playlist 1',
          description: 'First test playlist',
          user_id: userId,
          created_at: new Date()
        },
        {
          id: 2,
          name: 'Test Playlist 2',
          description: 'Second test playlist',
          user_id: userId,
          created_at: new Date()
        }
      ];

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockPlaylists,
        rowCount: 2
      });

      // Execute the function
      const result = await getPlaylistsByUserId(userId);

      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM playlists WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      // Verify result
      expect(result).toEqual(mockPlaylists);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no playlists found for user id', async () => {
      // Mock data
      const userId = 999;

      // Mock database response with empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Execute the function
      const result = await getPlaylistsByUserId(userId);

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
      await expect(getPlaylistsByUserId(1)).rejects.toThrow('Database error');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('updatePlaylist', () => {
    it('should update a playlist with valid data', async () => {
      // Mock data
      const playlistId = 1;
      const playlistData = {
        name: 'Updated Playlist Name',
        description: 'Updated playlist description'
      };
      const mockUpdatedPlaylist = {
        id: playlistId,
        ...playlistData,
        user_id: 1,
        created_at: new Date()
      };

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockUpdatedPlaylist],
        rowCount: 1
      });

      // Execute the function
      const result = await updatePlaylist(playlistId, playlistData);

      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE playlists SET name = $1, description = $2 WHERE id = $3 RETURNING *',
        ['Updated Playlist Name', 'Updated playlist description', playlistId]
      );

      // Verify result
      expect(result).toEqual(mockUpdatedPlaylist);
    });

    it('should return undefined when playlist not found for update', async () => {
      // Mock data
      const playlistId = 999;
      const playlistData = {
        name: 'Updated Playlist Name',
        description: 'Updated playlist description'
      };

      // Mock database response with empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Execute the function
      const result = await updatePlaylist(playlistId, playlistData);

      // Verify database was queried
      expect(pool.query).toHaveBeenCalledTimes(1);

      // Verify result is undefined
      expect(result).toBeUndefined();
    });

    it('should throw error when database query fails', async () => {
      // Mock data
      const playlistId = 1;
      const playlistData = {
        name: 'Updated Playlist Name',
        description: 'Updated playlist description'
      };

      // Setup mock for pool.query to throw error
      const dbError = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Execute and verify function throws error
      await expect(updatePlaylist(playlistId, playlistData)).rejects.toThrow('Database error');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('deletePlaylist', () => {
    it('should delete a playlist and return the deleted playlist data', async () => {
      // Mock data
      const playlistId = 1;
      const mockDeletedPlaylist = {
        id: playlistId,
        name: 'Test Playlist',
        description: 'A test playlist description',
        user_id: 1,
        created_at: new Date()
      };

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockDeletedPlaylist],
        rowCount: 1
      });

      // Execute the function
      const result = await deletePlaylist(playlistId);

      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM playlists WHERE id = $1 RETURNING *',
        [playlistId]
      );

      // Verify result
      expect(result).toEqual(mockDeletedPlaylist);
    });

    it('should return undefined when playlist not found for deletion', async () => {
      // Mock data
      const playlistId = 999;

      // Mock database response with empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Execute the function
      const result = await deletePlaylist(playlistId);

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
      await expect(deletePlaylist(1)).rejects.toThrow('Database error');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });
}); 