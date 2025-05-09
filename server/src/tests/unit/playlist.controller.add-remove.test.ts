import { Response } from 'express';
import pool from '../../config/db';

// Import the simplified controller
const { addSongToPlaylist, removeSongFromPlaylist } = require('../../controllers/playlist.controller.simple.js');

// Mock the database pool
jest.mock('../../config/db', () => ({
  query: jest.fn(),
}));

// Define a custom mock request type for testing
interface MockRequest {
  user?: any;
  params: any;
  body: any;
  app: any;
}

describe('Playlist Controller - Add/Remove Songs', () => {
  let mockRequest: MockRequest;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      user: { id: '1' },
      params: { playlistId: '1', songId: '1' },
      body: { songId: '1' },
      app: {
        locals: {
          db: {
            pool
          }
        }
      }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Reset the pool.query mock
    (pool.query as jest.Mock).mockReset();
    
    // Mock console methods to reduce noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addSongToPlaylist', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;
      
      await addSongToPlaylist(
        mockRequest as any,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should return 400 if song ID is not provided', async () => {
      mockRequest.body = {};
      
      await addSongToPlaylist(
        mockRequest as any,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Song ID is required' });
    });

    it('should return 404 if playlist does not exist', async () => {
      // Mock to return no playlist
      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('SELECT * FROM playlists')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });
      
      await addSongToPlaylist(
        mockRequest as any,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Playlist not found' });
    });

    it('should return 404 if song does not exist', async () => {
      // Mock to return a playlist but no song
      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('SELECT * FROM playlists')) {
          return Promise.resolve({ rows: [{ id: '1', name: 'Test Playlist', user_id: '1' }] });
        } else if (query.includes('SELECT * FROM songs')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });
      
      await addSongToPlaylist(
        mockRequest as any,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Song not found' });
    });

    it('should return 400 if song is already in the playlist', async () => {
      // Mock to return a playlist, a song, and an existing playlist_song entry
      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('SELECT * FROM playlists')) {
          return Promise.resolve({ rows: [{ id: '1', name: 'Test Playlist', user_id: '1' }] });
        } else if (query.includes('SELECT * FROM songs')) {
          return Promise.resolve({ rows: [{ id: '1', title: 'Test Song' }] });
        } else if (query.includes('SELECT * FROM playlist_songs')) {
          return Promise.resolve({ rows: [{ playlist_id: '1', song_id: '1', position: 1 }] });
        }
        return Promise.resolve({ rows: [] });
      });
      
      await addSongToPlaylist(
        mockRequest as any,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Song is already in the playlist' });
    });

    it('should successfully add a song to playlist with provided position', async () => {
      mockRequest.body = { songId: '1', position: 3 };
      
      // Mock the database responses
      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('SELECT * FROM playlists')) {
          return Promise.resolve({ rows: [{ id: '1', name: 'Test Playlist', user_id: '1' }] });
        } else if (query.includes('SELECT * FROM songs')) {
          return Promise.resolve({ rows: [{ id: '1', title: 'Test Song' }] });
        } else if (query.includes('SELECT * FROM playlist_songs')) {
          return Promise.resolve({ rows: [] }); // No existing entry
        } else if (query.includes('INSERT INTO playlist_songs')) {
          return Promise.resolve({ rows: [{ playlist_id: '1', song_id: '1', position: 3 }] });
        }
        return Promise.resolve({ rows: [] });
      });
      
      await addSongToPlaylist(
        mockRequest as any,
        mockResponse as Response
      );
      
      // Verify song was added with provided position
      const insertCall = (pool.query as jest.Mock).mock.calls.find(
        (call: any[]) => call[0].includes('INSERT INTO playlist_songs')
      );
      expect(insertCall).toBeDefined();
      expect(insertCall[1]).toEqual(['1', '1', 3]); // playlistId, songId, position
      
      // Verify success response
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Song added to playlist' });
    });

    it('should automatically assign next position if not provided', async () => {
      mockRequest.body = { songId: '1' }; // No position provided
      
      // Mock the database responses
      (pool.query as jest.Mock).mockImplementation((query: string, params?: any[]) => {
        if (query.includes('SELECT * FROM playlists')) {
          return Promise.resolve({ rows: [{ id: '1', name: 'Test Playlist', user_id: '1' }] });
        } else if (query.includes('SELECT * FROM songs')) {
          return Promise.resolve({ rows: [{ id: '1', title: 'Test Song' }] });
        } else if (query.includes('SELECT * FROM playlist_songs')) {
          return Promise.resolve({ rows: [] }); // No existing entry
        } else if (query.includes('MAX(position)')) {
          return Promise.resolve({ rows: [{ max_pos: 2 }] }); // Last position is 2
        } else if (query.includes('INSERT INTO playlist_songs')) {
          return Promise.resolve({ rows: [{ playlist_id: '1', song_id: '1', position: 3 }] });
        }
        return Promise.resolve({ rows: [] });
      });
      
      await addSongToPlaylist(
        mockRequest as any,
        mockResponse as Response
      );
      
      // Verify song was added with correct position (max + 1)
      const insertCall = (pool.query as jest.Mock).mock.calls.find(
        (call: any[]) => call[0].includes('INSERT INTO playlist_songs')
      );
      expect(insertCall).toBeDefined();
      expect(insertCall[1]).toEqual(['1', '1', 3]); // playlistId, songId, position (max + 1)
      
      // Verify success response
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Song added to playlist' });
    });

    it('should handle database errors', async () => {
      // Mock to throw an error
      (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      await addSongToPlaylist(
        mockRequest as any,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('removeSongFromPlaylist', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;
      
      await removeSongFromPlaylist(
        mockRequest as any,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should return 404 if playlist does not exist', async () => {
      // Mock to return no playlist
      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('SELECT * FROM playlists')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });
      
      await removeSongFromPlaylist(
        mockRequest as any,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Playlist not found' });
    });

    it('should successfully remove a song from playlist', async () => {
      // Mock the database responses
      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('SELECT * FROM playlists')) {
          return Promise.resolve({ rows: [{ id: '1', name: 'Test Playlist', user_id: '1' }] });
        } else if (query.includes('DELETE FROM playlist_songs')) {
          return Promise.resolve({ rowCount: 1 }); // One row deleted
        }
        return Promise.resolve({ rows: [] });
      });
      
      await removeSongFromPlaylist(
        mockRequest as any,
        mockResponse as Response
      );
      
      // Verify song was deleted from playlist
      const deleteCall = (pool.query as jest.Mock).mock.calls.find(
        (call: any[]) => call[0].includes('DELETE FROM playlist_songs')
      );
      expect(deleteCall).toBeDefined();
      expect(deleteCall[1]).toEqual(['1', '1']); // playlistId, songId
      
      // Verify success response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Song removed from playlist' });
    });

    it('should handle database errors', async () => {
      // Mock to throw an error
      (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      await removeSongFromPlaylist(
        mockRequest as any,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
}); 