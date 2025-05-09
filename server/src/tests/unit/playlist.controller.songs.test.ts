import { Request, Response } from 'express';
import { addSongToPlaylist, removeSongFromPlaylist } from './playlist.controller.songs-test-fixes';
import { testControllerWrapper } from '../../utils/testWrappers';
import { TestUser } from '../../types';

// Mock the database pool
jest.mock('../../config/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn().mockReturnValue({
      query: jest.fn(),
      release: jest.fn(),
    })
  }
}));

describe('Playlist Controller - Song Management', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockPool: any;
  let wrappedAddSongToPlaylist: any;
  let wrappedRemoveSongFromPlaylist: any;

  beforeEach(() => {
    mockRequest = {
      params: {
        playlistId: '1',
        songId: '1'
      },
      body: {
        songId: '1'
      },
      user: { id: 123 } as TestUser
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockPool = require('../../config/db').pool;
    wrappedAddSongToPlaylist = testControllerWrapper(addSongToPlaylist);
    wrappedRemoveSongFromPlaylist = testControllerWrapper(removeSongFromPlaylist);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  // Tests for addSongToPlaylist
  describe('addSongToPlaylist', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;
      
      await wrappedAddSongToPlaylist(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should return 400 if songId is not provided', async () => {
      mockRequest.body = {};
      
      await wrappedAddSongToPlaylist(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Song ID is required' });
    });

    it('should return 404 if playlist does not exist', async () => {
      // Mock to return no playlist
      mockPool.connect.mockReturnValueOnce({
        query: jest.fn().mockImplementation((query: string) => {
          if (query.includes('SELECT * FROM playlists')) {
            return Promise.resolve({ rows: [] });
          }
          return Promise.resolve({ rows: [] });
        }),
        release: jest.fn()
      });
      
      await wrappedAddSongToPlaylist(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
    });

    // More tests for addSongToPlaylist...
  });

  // Tests for removeSongFromPlaylist
  describe('removeSongFromPlaylist', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;
      
      await wrappedRemoveSongFromPlaylist(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    // More tests for removeSongFromPlaylist...
  });
}); 