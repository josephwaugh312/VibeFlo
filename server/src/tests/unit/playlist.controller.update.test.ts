import { Request, Response } from 'express';
import { Pool } from 'pg';
import * as playlistController from '../../controllers/playlist.controller';
import pool from '../../config/db';

// Mock the pg Pool
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
    connect: jest.fn()
  };
  return { Pool: jest.fn(() => mockPool) };
});

// Mock console to reduce noise in tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock the database pool
jest.mock('../../config/db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

// Define the AuthRequest interface to match the one in the controller
interface AuthRequest extends Request {
  user?: any;
}

describe('Playlist Controller - updatePlaylist', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockClient: any;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock console methods to reduce test noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Set up mock request and response objects
    mockRequest = {
      user: { id: 1 },
      params: { id: '1' },
      body: {},
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Set up mock client for transactions
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    
    // Mock the pool.connect to return our mock client
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;
    
    await playlistController.updatePlaylist(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
  });

  it('should return 404 if playlist does not exist', async () => {
    // Mock the query to return empty rows for playlist check
    // First query should return empty rows for a specific playlist check
    // Second query should also return empty rows for playlist exists check
    (pool.query as jest.Mock).mockImplementation((query: string, params?: any[]) => {
      if (query.includes('SELECT * FROM playlists WHERE id = $1 AND user_id = $2')) {
        return Promise.resolve({ rows: [] });
      } else if (query.includes('SELECT * FROM playlists WHERE id = $1')) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    });
    
    await playlistController.updatePlaylist(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Playlist not found' });
  });

  it('should return 403 if user does not own the playlist', async () => {
    // Mock the first query to return empty rows (user doesn't own playlist)
    // Mock the second query to return a playlist (playlist exists but belongs to another user)
    (pool.query as jest.Mock).mockImplementation((query: string, params?: any[]) => {
      if (query.includes('SELECT * FROM playlists WHERE id = $1 AND user_id = $2')) {
        return Promise.resolve({ rows: [] });
      } else if (query.includes('SELECT * FROM playlists WHERE id = $1')) {
        return Promise.resolve({ rows: [{ id: 1, name: 'Test Playlist', user_id: 2 }] });
      }
      return Promise.resolve({ rows: [] });
    });
    
    await playlistController.updatePlaylist(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'You do not have permission to update this playlist' });
  });

  it('should update the playlist name and description', async () => {
    // Set up request body
    mockRequest.body = { 
      name: 'Updated Playlist', 
      description: 'New description' 
    };
    
    // Mock the query to return a playlist for initial check
    (pool.query as jest.Mock).mockResolvedValueOnce({ 
      rows: [{ id: 1, name: 'Original Playlist', description: 'Old description', user_id: 1 }] 
    });
    
    // Set up client query responses
    mockClient.query.mockImplementation((query: string, params?: any[]) => {
      if (query === 'BEGIN') {
        return Promise.resolve();
      } else if (query.includes('UPDATE playlists')) {
        return Promise.resolve({ 
          rows: [{ 
            id: 1, 
            name: 'Updated Playlist', 
            description: 'New description', 
            user_id: 1 
          }]
        });
      } else if (query.includes('SELECT s.*')) {
        return Promise.resolve({ rows: [] });
      } else if (query === 'COMMIT') {
        return Promise.resolve();
      }
      return Promise.resolve({ rows: [] });
    });
    
    await playlistController.updatePlaylist(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    // Verify transaction was started and committed
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    
    // Verify the playlist was updated
    expect(mockClient.query).toHaveBeenCalledWith(
      'UPDATE playlists SET name = $1, description = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      ['Updated Playlist', 'New description', '1', 1]
    );
    
    // Verify client was released
    expect(mockClient.release).toHaveBeenCalled();
    
    // Verify correct response
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        name: 'Updated Playlist',
        description: 'New description'
      })
    );
  });

  it('should handle transaction errors', async () => {
    // Set up request body
    mockRequest.body = { name: 'Updated Playlist' };
    
    // Mock the query to return a playlist for initial check
    (pool.query as jest.Mock).mockResolvedValueOnce({ 
      rows: [{ id: 1, name: 'Original Playlist', user_id: 1 }] 
    });
    
    // Set up client query to throw error during update
    mockClient.query.mockImplementation((query: string) => {
      if (query === 'BEGIN') {
        return Promise.resolve();
      } else if (query.includes('UPDATE playlists')) {
        return Promise.reject(new Error('Database error'));
      } else if (query === 'ROLLBACK') {
        return Promise.resolve();
      }
      return Promise.resolve({ rows: [] });
    });
    
    await playlistController.updatePlaylist(
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

  it('should add new tracks to the playlist', async () => {
    // Set up request with tracks
    mockRequest.body = {
      name: 'Updated Playlist',
      tracks: [
        { title: 'New Song', artist: 'Test Artist' }
      ]
    };
    
    // Mock the query to return a playlist for initial check
    (pool.query as jest.Mock).mockResolvedValueOnce({ 
      rows: [{ id: 1, name: 'Original Playlist', user_id: 1 }] 
    });
    
    // Track the queries to ensure consistent results
    const trackData = { id: 1, title: 'New Song', artist: 'Test Artist' };
    
    // Set up client query responses
    mockClient.query.mockImplementation((query: string, params?: any[]) => {
      if (query === 'BEGIN') {
        return Promise.resolve();
      } else if (query.includes('UPDATE playlists')) {
        return Promise.resolve({ 
          rows: [{ id: 1, name: 'Updated Playlist', user_id: 1 }]
        });
      } else if (query.includes('DELETE FROM playlist_songs')) {
        return Promise.resolve({ rowCount: 0 });
      } else if (query.includes('INSERT INTO songs')) {
        return Promise.resolve({
          rows: [trackData]
        });
      } else if (query.includes('INSERT INTO playlist_songs')) {
        return Promise.resolve({ rowCount: 1 });
      } else if (query.includes('SELECT s.* FROM songs')) {
        // This is the critical response - must return the track data
        return Promise.resolve({
          rows: [trackData]
        });
      } else if (query === 'COMMIT') {
        return Promise.resolve();
      }
      return Promise.resolve({ rows: [] });
    });
    
    await playlistController.updatePlaylist(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    // Verify the transaction was committed
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    
    // Verify song was inserted
    const songInsertCall = mockClient.query.mock.calls.find(
      (call: any[]) => call[0].includes('INSERT INTO songs')
    );
    expect(songInsertCall).toBeDefined();
    
    // Verify the song was added to the playlist
    const playlistSongInsertCall = mockClient.query.mock.calls.find(
      (call: any[]) => call[0].includes('INSERT INTO playlist_songs')
    );
    expect(playlistSongInsertCall).toBeDefined();
    
    // Verify correct response - mocked json must be called with the playlist with tracks
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        name: 'Updated Playlist',
        tracks: expect.arrayContaining([
          expect.objectContaining({ id: 1, title: 'New Song', artist: 'Test Artist' })
        ])
      })
    );
  });

  it('should handle empty body', async () => {
    mockRequest.body = {};
    
    // Mock the query to return a playlist for initial check
    (pool.query as jest.Mock).mockResolvedValueOnce({ 
      rows: [{ id: 1, name: 'Original Playlist', user_id: 1 }] 
    });
    
    // Set up client query responses
    mockClient.query.mockImplementation((query: string, params?: any[]) => {
      if (query === 'BEGIN') {
        return Promise.resolve();
      } else if (query.includes('UPDATE playlists')) {
        return Promise.resolve({ 
          rows: [{ id: 1, name: 'Original Playlist', user_id: 1 }]
        });
      } else if (query.includes('SELECT s.*')) {
        return Promise.resolve({ rows: [] });
      } else if (query === 'COMMIT') {
        return Promise.resolve();
      }
      return Promise.resolve({ rows: [] });
    });
    
    await playlistController.updatePlaylist(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    // Verify update was called with original values
    const updateCall = mockClient.query.mock.calls.find(
      (call: any[]) => call[0].includes('UPDATE playlists')
    );
    expect(updateCall).toBeDefined();
    
    // Verify success response
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        name: 'Original Playlist'
      })
    );
  });
}); 