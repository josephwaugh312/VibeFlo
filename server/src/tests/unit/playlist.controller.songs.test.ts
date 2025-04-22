import { Request, Response } from 'express';
import { Pool } from 'pg';
import * as playlistController from '../../controllers/playlist.controller';

// Mock the database pool
jest.mock('../../config/db', () => {
  const mockQuery = jest.fn();
  return {
    query: mockQuery,
    connect: jest.fn().mockReturnValue({
      query: mockQuery,
      release: jest.fn(),
    })
  };
});

// Import the mock after it's been mocked
import pool from '../../config/db';

// Define interface for AuthRequest
interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    name: string;
  };
  params: any;
  body: any;
}

describe('Playlist Controller - Song Operations', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User'
      },
      params: {},
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('addSongToPlaylist', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { playlistId: '1' };
      mockRequest.body = { songId: 1 };

      await playlistController.addSongToPlaylist(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should return 400 if song ID is not provided', async () => {
      mockRequest.params = { playlistId: '1' };
      mockRequest.body = {}; // No songId

      await playlistController.addSongToPlaylist(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Song ID is required' });
    });

    it('should return 404 if playlist is not found', async () => {
      mockRequest.params = { playlistId: '1' };
      mockRequest.body = { songId: 1 };

      const mockQueryFn = pool.query as jest.Mock;
      mockQueryFn.mockResolvedValueOnce({ rows: [] }); // No playlist found

      await playlistController.addSongToPlaylist(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Playlist not found' });
    });

    it('should return 404 if song is not found', async () => {
      mockRequest.params = { playlistId: '1' };
      mockRequest.body = { songId: 1 };

      const mockQueryFn = pool.query as jest.Mock;
      mockQueryFn.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] }); // Playlist found
      mockQueryFn.mockResolvedValueOnce({ rows: [] }); // No song found

      await playlistController.addSongToPlaylist(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Song not found' });
    });

    it('should return 400 if song is already in playlist', async () => {
      mockRequest.params = { playlistId: '1' };
      mockRequest.body = { songId: 1 };

      const mockQueryFn = pool.query as jest.Mock;
      mockQueryFn.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] }); // Playlist found
      mockQueryFn.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Song found
      mockQueryFn.mockResolvedValueOnce({ rows: [{ playlist_id: 1, song_id: 1 }] }); // Song already in playlist

      await playlistController.addSongToPlaylist(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Song is already in the playlist' });
    });

    it('should add song to playlist with specified position', async () => {
      mockRequest.params = { playlistId: '1' };
      mockRequest.body = { songId: 1, position: 3 };

      const mockQueryFn = pool.query as jest.Mock;
      mockQueryFn.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] }); // Playlist found
      mockQueryFn.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Song found
      mockQueryFn.mockResolvedValueOnce({ rows: [] }); // Song not in playlist
      mockQueryFn.mockResolvedValueOnce({ rows: [] }); // Insert success

      await playlistController.addSongToPlaylist(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockQueryFn.mock.calls[3][0]).toContain('INSERT INTO playlist_songs');
      expect(mockQueryFn.mock.calls[3][1]).toEqual(['1', 1, 3]); // playlistId, songId, position
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Song added to playlist' });
    });

    it('should add song to playlist with automatically calculated position', async () => {
      mockRequest.params = { playlistId: '1' };
      mockRequest.body = { songId: 1 }; // No position specified

      const mockQueryFn = pool.query as jest.Mock;
      mockQueryFn.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] }); // Playlist found
      mockQueryFn.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Song found
      mockQueryFn.mockResolvedValueOnce({ rows: [] }); // Song not in playlist
      mockQueryFn.mockResolvedValueOnce({ rows: [{ max_pos: 5 }] }); // Last position is 5
      mockQueryFn.mockResolvedValueOnce({ rows: [] }); // Insert success

      await playlistController.addSongToPlaylist(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockQueryFn.mock.calls[4][0]).toContain('INSERT INTO playlist_songs');
      expect(mockQueryFn.mock.calls[4][1]).toEqual(['1', 1, 6]); // playlistId, songId, position (5+1)
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Song added to playlist' });
    });

    it('should handle database errors', async () => {
      mockRequest.params = { playlistId: '1' };
      mockRequest.body = { songId: 1 };

      const mockQueryFn = pool.query as jest.Mock;
      mockQueryFn.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] }); // Playlist found
      mockQueryFn.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Song found
      mockQueryFn.mockResolvedValueOnce({ rows: [] }); // Song not in playlist
      mockQueryFn.mockRejectedValueOnce(new Error('Database error')); // Error with max position query

      await playlistController.addSongToPlaylist(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('removeSongFromPlaylist', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { playlistId: '1', songId: '1' };

      await playlistController.removeSongFromPlaylist(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should return 404 if playlist is not found', async () => {
      mockRequest.params = { playlistId: '1', songId: '1' };

      const mockQueryFn = pool.query as jest.Mock;
      mockQueryFn.mockResolvedValueOnce({ rows: [] }); // No playlist found

      await playlistController.removeSongFromPlaylist(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Playlist not found' });
    });

    it('should remove song from playlist successfully', async () => {
      mockRequest.params = { playlistId: '1', songId: '1' };

      const mockQueryFn = pool.query as jest.Mock;
      mockQueryFn.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] }); // Playlist found
      mockQueryFn.mockResolvedValueOnce({ rows: [] }); // Delete operation successful

      await playlistController.removeSongFromPlaylist(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockQueryFn.mock.calls[1][0]).toContain('DELETE FROM playlist_songs');
      expect(mockQueryFn.mock.calls[1][1]).toEqual(['1', '1']); // playlistId, songId
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Song removed from playlist' });
    });

    it('should handle database errors', async () => {
      mockRequest.params = { playlistId: '1', songId: '1' };

      const mockQueryFn = pool.query as jest.Mock;
      mockQueryFn.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] }); // Playlist found
      mockQueryFn.mockRejectedValueOnce(new Error('Database error')); // Error with delete query

      await playlistController.removeSongFromPlaylist(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
}); 