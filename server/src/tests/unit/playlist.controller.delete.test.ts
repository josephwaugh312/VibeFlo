import { Request, Response } from 'express';
import * as playlistController from '../../controllers/playlist.controller';
import pool from '../../config/db';

// Mock the database pool
jest.mock('../../config/db', () => ({
  connect: jest.fn(),
  query: jest.fn(),
}));

interface AuthRequest extends Request {
  user?: any;
}

describe('Playlist Controller - deletePlaylist', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockClient: any;

  beforeEach(() => {
    mockRequest = {
      user: { id: '1' },
      params: { id: '1' },
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    
    // Mock the connect method to return our mockClient
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
    
    // Reset the pool.query mock
    (pool.query as jest.Mock).mockReset();
    
    // Mock console methods to reduce noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;
    
    await playlistController.deletePlaylist(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
  });

  it('should return 404 if playlist does not exist', async () => {
    // Mock the query to return no playlists
    mockClient.query.mockImplementation((query: string) => {
      if (query.includes('SELECT * FROM playlists')) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve();
    });
    
    await playlistController.deletePlaylist(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Playlist not found' });
  });

  it('should return 403 if user does not own the playlist', async () => {
    // Mock the query to return a playlist owned by a different user
    mockClient.query.mockImplementation((query: string) => {
      if (query.includes('SELECT * FROM playlists')) {
        return Promise.resolve({
          rows: [{ id: '1', name: 'Test Playlist', user_id: '2' }]
        });
      }
      return Promise.resolve();
    });
    
    await playlistController.deletePlaylist(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'You do not have permission to delete this playlist' });
  });

  it('should successfully delete a playlist', async () => {
    // Mock the transaction queries
    mockClient.query.mockImplementation((query: string) => {
      if (query === 'BEGIN' || query === 'COMMIT') {
        return Promise.resolve();
      } else if (query.includes('SELECT * FROM playlists')) {
        return Promise.resolve({
          rows: [{ id: '1', name: 'Test Playlist', user_id: '1' }]
        });
      } else if (query.includes('DELETE FROM playlist_songs')) {
        return Promise.resolve({ rowCount: 2 }); // Simulate 2 songs deleted
      } else if (query.includes('DELETE FROM playlists')) {
        return Promise.resolve({ rowCount: 1 }); // Simulate playlist deleted
      }
      return Promise.resolve();
    });
    
    await playlistController.deletePlaylist(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    // Verify transaction was started and committed
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    
    // Verify playlist_songs were deleted first
    const deleteSongsCall = mockClient.query.mock.calls.find(
      (call: any[]) => call[0].includes('DELETE FROM playlist_songs')
    );
    expect(deleteSongsCall).toBeDefined();
    
    // Verify playlist was deleted
    const deletePlaylistCall = mockClient.query.mock.calls.find(
      (call: any[]) => call[0].includes('DELETE FROM playlists')
    );
    expect(deletePlaylistCall).toBeDefined();
    
    // Verify client was released
    expect(mockClient.release).toHaveBeenCalled();
    
    // Verify success response
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Playlist deleted successfully' });
  });

  it('should handle transaction errors when deleting songs', async () => {
    // Mock the queries to simulate an error when deleting songs
    mockClient.query.mockImplementation((query: string) => {
      if (query === 'BEGIN') {
        return Promise.resolve();
      } else if (query.includes('SELECT * FROM playlists')) {
        return Promise.resolve({
          rows: [{ id: '1', name: 'Test Playlist', user_id: '1' }]
        });
      } else if (query.includes('DELETE FROM playlist_songs')) {
        return Promise.reject(new Error('Database error'));
      }
      return Promise.resolve();
    });
    
    await playlistController.deletePlaylist(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    // Verify transaction was rolled back
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    
    // Verify client was released
    expect(mockClient.release).toHaveBeenCalled();
    
    // Verify error response
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
  });

  it('should handle transaction errors when deleting playlist', async () => {
    // Mock the queries to simulate an error when deleting the playlist
    mockClient.query.mockImplementation((query: string) => {
      if (query === 'BEGIN') {
        return Promise.resolve();
      } else if (query.includes('SELECT * FROM playlists')) {
        return Promise.resolve({
          rows: [{ id: '1', name: 'Test Playlist', user_id: '1' }]
        });
      } else if (query.includes('DELETE FROM playlist_songs')) {
        return Promise.resolve({ rowCount: 2 });
      } else if (query.includes('DELETE FROM playlists')) {
        return Promise.reject(new Error('Database error'));
      }
      return Promise.resolve();
    });
    
    await playlistController.deletePlaylist(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    // Verify transaction was rolled back
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    
    // Verify client was released
    expect(mockClient.release).toHaveBeenCalled();
    
    // Verify error response
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
  });

  it('should handle database connection errors', async () => {
    // Mock the connect method to throw an error
    (pool.connect as jest.Mock).mockRejectedValue(new Error('Connection error'));
    
    await playlistController.deletePlaylist(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    // Verify error response
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
  });
}); 