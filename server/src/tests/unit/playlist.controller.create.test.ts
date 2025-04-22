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

describe('Playlist Controller - createPlaylist', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockClient: any;

  beforeEach(() => {
    mockRequest = {
      user: { id: '1' },
      body: {}
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
    
    await playlistController.createPlaylist(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
  });

  it('should return 400 if playlist name is not provided', async () => {
    mockRequest.body = {}; // No name provided
    
    await playlistController.createPlaylist(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Playlist name is required' });
  });

  it('should successfully create a playlist without tracks', async () => {
    mockRequest.body = { name: 'Test Playlist' };
    
    // Mock the transaction queries
    mockClient.query.mockImplementation((query: string, params?: any[]) => {
      if (query === 'BEGIN') {
        return Promise.resolve();
      } else if (query === 'COMMIT') {
        return Promise.resolve();
      } else if (query.includes('INSERT INTO playlists')) {
        return Promise.resolve({
          rows: [{ id: '1', name: 'Test Playlist', description: null, user_id: '1' }]
        });
      }
      return Promise.resolve({ rows: [] });
    });
    
    await playlistController.createPlaylist(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    // Verify transaction was started and committed
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    
    // Verify the playlist was created
    const insertCall = mockClient.query.mock.calls.find(
      (call: any[]) => call[0].includes('INSERT INTO playlists')
    );
    expect(insertCall).toBeDefined();
    expect(insertCall[1]).toEqual(['Test Playlist', null, '1']);
    
    // Verify client was released
    expect(mockClient.release).toHaveBeenCalled();
    
    // Verify the response
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        name: 'Test Playlist',
        user_id: '1'
      })
    );
  });

  it('should create a playlist with tracks', async () => {
    mockRequest.body = {
      name: 'Test Playlist with Tracks',
      description: 'A test playlist',
      tracks: [
        {
          title: 'Test Song',
          artist: 'Test Artist',
          album: 'Test Album',
          duration: 180,
          artwork: 'http://example.com/image.jpg',
          url: 'http://example.com/song.mp3',
          youtube_id: 'abc123',
          source: 'youtube'
        }
      ]
    };
    
    // Mock the transaction queries
    mockClient.query.mockImplementation((query: string, params?: any[]) => {
      if (query === 'BEGIN') {
        return Promise.resolve();
      } else if (query === 'COMMIT') {
        return Promise.resolve();
      } else if (query.includes('INSERT INTO playlists')) {
        return Promise.resolve({
          rows: [{ 
            id: '1', 
            name: 'Test Playlist with Tracks',
            description: 'A test playlist',
            user_id: '1' 
          }]
        });
      } else if (query.includes('INSERT INTO songs')) {
        return Promise.resolve({
          rows: [{ 
            id: '1',
            title: 'Test Song',
            artist: 'Test Artist',
            album: 'Test Album',
            duration: 180
          }]
        });
      } else if (query.includes('SELECT s.*')) {
        return Promise.resolve({
          rows: [{ 
            id: '1',
            title: 'Test Song',
            artist: 'Test Artist',
            album: 'Test Album',
            duration: 180
          }]
        });
      }
      return Promise.resolve({ rows: [] });
    });
    
    await playlistController.createPlaylist(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    // Verify the song was added to the playlist
    const songInsertCall = mockClient.query.mock.calls.find(
      (call: any[]) => call[0].includes('INSERT INTO songs')
    );
    expect(songInsertCall).toBeDefined();
    expect(songInsertCall[1]).toEqual([
      'Test Song',
      'Test Artist',
      'Test Album',
      180,
      'http://example.com/image.jpg',
      'http://example.com/song.mp3',
      'abc123',
      'youtube'
    ]);
    
    // Verify the song was added to the playlist_songs table
    const playlistSongInsertCall = mockClient.query.mock.calls.find(
      (call: any[]) => call[0].includes('INSERT INTO playlist_songs')
    );
    expect(playlistSongInsertCall).toBeDefined();
    expect(playlistSongInsertCall[1]).toEqual(['1', '1', 1]);
    
    // Verify the response
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        name: 'Test Playlist with Tracks',
        tracks: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            title: 'Test Song',
            artist: 'Test Artist'
          })
        ])
      })
    );
  });

  it('should handle transaction errors', async () => {
    mockRequest.body = { name: 'Test Playlist' };
    
    // Mock a database error
    mockClient.query.mockImplementation((query: string) => {
      if (query === 'BEGIN') {
        return Promise.resolve();
      } else if (query.includes('INSERT INTO playlists')) {
        return Promise.reject(new Error('Database error'));
      }
      return Promise.resolve();
    });
    
    await playlistController.createPlaylist(
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

  it('should skip tracks without title or artist', async () => {
    mockRequest.body = {
      name: 'Test Playlist',
      tracks: [
        { title: 'Valid Song', artist: 'Valid Artist' },
        { title: 'Missing Artist' }, // Missing artist
        { artist: 'Missing Title' }  // Missing title
      ]
    };
    
    // Mock the transaction queries
    mockClient.query.mockImplementation((query: string) => {
      if (query === 'BEGIN' || query === 'COMMIT') {
        return Promise.resolve();
      } else if (query.includes('INSERT INTO playlists')) {
        return Promise.resolve({
          rows: [{ id: '1', name: 'Test Playlist', user_id: '1' }]
        });
      } else if (query.includes('INSERT INTO songs')) {
        return Promise.resolve({
          rows: [{ id: '1', title: 'Valid Song', artist: 'Valid Artist' }]
        });
      } else if (query.includes('SELECT s.*')) {
        return Promise.resolve({
          rows: [{ id: '1', title: 'Valid Song', artist: 'Valid Artist' }]
        });
      }
      return Promise.resolve({ rows: [] });
    });
    
    await playlistController.createPlaylist(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    // Verify only one song was inserted
    const songInsertCalls = mockClient.query.mock.calls.filter(
      (call: any[]) => call[0].includes('INSERT INTO songs')
    );
    expect(songInsertCalls.length).toBe(1);
    
    // Verify success response
    expect(mockResponse.status).toHaveBeenCalledWith(201);
  });
}); 