import { Request, Response } from 'express';
import { searchSongs, getSongById, createSong } from '../../controllers/song.controller';
import pool from '../../config/db';

// Mock the database pool
jest.mock('../../config/db', () => {
  return {
    query: jest.fn()
  };
});

// Mock console.error to prevent test output noise
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Song Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup mock response with spy functions
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Setup default mock request
    mockRequest = {};
  });
  
  describe('searchSongs', () => {
    it('should return songs that match the search query', async () => {
      // Setup mock request with search query
      mockRequest = {
        query: {
          query: 'test song'
        }
      };
      
      // Mock database response
      const mockSongs = [
        { id: 1, title: 'Test Song 1', artist: 'Artist 1', album: 'Album 1' },
        { id: 2, title: 'Another Test Song', artist: 'Artist 2', album: 'Album 2' }
      ];
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockSongs,
        rowCount: 2
      });
      
      // Execute controller
      await searchSongs(mockRequest as Request, mockResponse as Response);
      
      // Verify database was queried with correct params
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM songs'),
        ['%test song%']
      );
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockSongs);
    });
    
    it('should return 400 if search query is missing', async () => {
      // Setup mock request without query
      mockRequest = {
        query: {}
      };
      
      // Execute controller
      await searchSongs(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Search query is required' });
    });
    
    it('should return 400 if search query is not a string', async () => {
      // Setup mock request with invalid query type
      mockRequest = {
        query: {
          query: ['not a string'] as any
        }
      };
      
      // Execute controller
      await searchSongs(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Search query is required' });
    });
    
    it('should handle database errors', async () => {
      // Setup mock request with search query
      mockRequest = {
        query: {
          query: 'test song'
        }
      };
      
      // Mock database to throw an error
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      // Execute controller
      await searchSongs(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('getSongById', () => {
    it('should return a song by its ID', async () => {
      // Setup mock request with song ID
      mockRequest = {
        params: {
          id: '1'
        }
      };
      
      // Mock database response
      const mockSong = { id: 1, title: 'Test Song', artist: 'Artist', album: 'Album' };
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockSong],
        rowCount: 1
      });
      
      // Execute controller
      await getSongById(mockRequest as Request, mockResponse as Response);
      
      // Verify database was queried with correct params
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM songs WHERE id = $1', ['1']);
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockSong);
    });
    
    it('should return 404 if song is not found', async () => {
      // Setup mock request with non-existent song ID
      mockRequest = {
        params: {
          id: '999'
        }
      };
      
      // Mock database to return no rows
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });
      
      // Execute controller
      await getSongById(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Song not found' });
    });
    
    it('should handle database errors', async () => {
      // Setup mock request
      mockRequest = {
        params: {
          id: '1'
        }
      };
      
      // Mock database to throw an error
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      // Execute controller
      await getSongById(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('createSong', () => {
    it('should create a new song with valid data', async () => {
      // Setup mock request with song data
      mockRequest = {
        body: {
          title: 'New Test Song',
          artist: 'New Artist',
          album: 'New Album',
          duration: 180,
          image_url: 'http://example.com/image.jpg'
        }
      };
      
      // Mock database response
      const mockNewSong = {
        id: 1,
        title: 'New Test Song',
        artist: 'New Artist',
        album: 'New Album',
        duration: 180,
        image_url: 'http://example.com/image.jpg'
      };
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockNewSong],
        rowCount: 1
      });
      
      // Execute controller
      await createSong(mockRequest as Request, mockResponse as Response);
      
      // Verify database was queried with correct params
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO songs (title, artist, album, duration, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        ['New Test Song', 'New Artist', 'New Album', 180, 'http://example.com/image.jpg']
      );
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockNewSong);
    });
    
    it('should handle optional fields being null', async () => {
      // Setup mock request with only required fields
      mockRequest = {
        body: {
          title: 'New Test Song',
          artist: 'New Artist'
        }
      };
      
      // Mock database response
      const mockNewSong = {
        id: 1,
        title: 'New Test Song',
        artist: 'New Artist',
        album: null,
        duration: null,
        image_url: null
      };
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockNewSong],
        rowCount: 1
      });
      
      // Execute controller
      await createSong(mockRequest as Request, mockResponse as Response);
      
      // Verify database was queried with correct params
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO songs (title, artist, album, duration, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        ['New Test Song', 'New Artist', null, null, null]
      );
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockNewSong);
    });
    
    it('should return 400 if title is missing', async () => {
      // Setup mock request with missing title
      mockRequest = {
        body: {
          artist: 'New Artist',
          album: 'New Album'
        }
      };
      
      // Execute controller
      await createSong(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Title and artist are required' });
    });
    
    it('should return 400 if artist is missing', async () => {
      // Setup mock request with missing artist
      mockRequest = {
        body: {
          title: 'New Test Song',
          album: 'New Album'
        }
      };
      
      // Execute controller
      await createSong(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Title and artist are required' });
    });
    
    it('should handle database errors', async () => {
      // Setup mock request with valid data
      mockRequest = {
        body: {
          title: 'New Test Song',
          artist: 'New Artist'
        }
      };
      
      // Mock database to throw an error
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      // Execute controller
      await createSong(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalled();
    });
  });
}); 