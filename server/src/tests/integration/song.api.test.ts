import request from 'supertest';
import { app } from '../../app';
import pool from '../../config/db';
import { generateTestToken } from '../setupApiTests';
import { Request, Response, NextFunction } from 'express';

// Mock the database pool
jest.mock('../../config/db', () => {
  const { createMockPool } = require('../mocks/db-adapter.mock');
  return createMockPool();
});

// Mock passport
jest.mock('passport', () => {
  return {
    authenticate: jest.fn().mockImplementation(() => {
      return (req: Request, res: Response, next: NextFunction) => {
        // For testing, if Authorization header exists with Bearer token, set the user
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
          req.user = {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            username: 'testuser'
          };
        }
        return next();
      };
    }),
    initialize: jest.fn().mockReturnValue((req: Request, res: Response, next: NextFunction) => next()),
    use: jest.fn(),
    serializeUser: jest.fn(),
    deserializeUser: jest.fn()
  };
});

// Mock the auth middleware
jest.mock('../../middleware/auth.middleware', () => {
  return {
    protect: jest.fn().mockImplementation((req: Request, res: Response, next: NextFunction) => {
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        req.user = {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          username: 'testuser'
        };
        return next();
      }
      return res.status(401).json({ message: 'Unauthorized - No valid token provided' });
    }),
    optionalAuth: jest.fn().mockImplementation((req: Request, res: Response, next: NextFunction) => {
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        req.user = {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          username: 'testuser'
        };
      }
      return next();
    })
  };
});

// Mock passport-jwt Strategy
jest.mock('passport-jwt', () => {
  return {
    Strategy: jest.fn().mockImplementation(() => ({
      name: 'jwt'
    })),
    ExtractJwt: {
      fromAuthHeaderAsBearerToken: jest.fn().mockReturnValue(() => 'dummy_token_extractor')
    }
  };
});

describe('Song API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/songs/search', () => {
    it('should search for songs based on query', async () => {
      // Mock database response
      const mockSongs = [
        { id: 1, title: 'Test Song', artist: 'Test Artist', album: 'Test Album', duration: 180 },
        { id: 2, title: 'Another Test', artist: 'Same Artist', album: 'Different Album', duration: 240 }
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockSongs,
        rowCount: 2
      });

      // Make request
      const response = await request(app)
        .get('/api/songs/search')
        .query({ query: 'test' });

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSongs);
      
      // Verify database was queried with correct search term
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM songs'),
        ['%test%']
      );
    });

    it('should return 400 if search query is missing', async () => {
      // Make request without query parameter
      const response = await request(app)
        .get('/api/songs/search');

      // Assert response
      expect(response.status).toBe(400);
      expect(response.body).toEqual(expect.objectContaining({
        message: 'Search query is required'
      }));
    });

    it('should return empty array if no matching songs', async () => {
      // Mock database response with no results
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Make request
      const response = await request(app)
        .get('/api/songs/search')
        .query({ query: 'nonexistent' });

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/songs/:id', () => {
    it('should get a song by ID', async () => {
      // Mock database response
      const mockSong = {
        id: 1,
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        duration: 180,
        image_url: 'http://example.com/image.jpg'
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockSong],
        rowCount: 1
      });

      // Make request
      const response = await request(app)
        .get('/api/songs/1');

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSong);
      
      // Verify database was queried with correct ID
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM songs WHERE id = $1',
        ['1']
      );
    });

    it('should return 404 if song not found', async () => {
      // Mock database response with no results
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Make request
      const response = await request(app)
        .get('/api/songs/999');

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toEqual(expect.objectContaining({
        message: 'Song not found'
      }));
    });
  });

  describe('POST /api/songs', () => {
    it('should create a new song when authenticated', async () => {
      // Setup song data
      const songData = {
        title: 'New Song',
        artist: 'New Artist',
        album: 'New Album',
        duration: 240,
        image_url: 'http://example.com/new-image.jpg'
      };

      // Mock database response
      const createdSong = {
        id: 3,
        ...songData
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [createdSong],
        rowCount: 1
      });

      // Generate test token
      const token = generateTestToken();

      // Make request
      const response = await request(app)
        .post('/api/songs')
        .set('Authorization', `Bearer ${token}`)
        .send(songData);

      // Assert response
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdSong);
      
      // Verify database was queried with correct data
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO songs (title, artist, album, duration, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [songData.title, songData.artist, songData.album, songData.duration, songData.image_url]
      );
    });

    it('should return 400 if title is missing', async () => {
      // Setup incomplete song data
      const incompleteSong = {
        artist: 'New Artist',
        album: 'New Album'
      };

      // Generate test token
      const token = generateTestToken();

      // Make request
      const response = await request(app)
        .post('/api/songs')
        .set('Authorization', `Bearer ${token}`)
        .send(incompleteSong);

      // Assert response
      expect(response.status).toBe(400);
      expect(response.body).toEqual(expect.objectContaining({
        message: 'Title and artist are required'
      }));
    });

    it('should return 400 if artist is missing', async () => {
      // Setup incomplete song data
      const incompleteSong = {
        title: 'New Song',
        album: 'New Album'
      };

      // Generate test token
      const token = generateTestToken();

      // Make request
      const response = await request(app)
        .post('/api/songs')
        .set('Authorization', `Bearer ${token}`)
        .send(incompleteSong);

      // Assert response
      expect(response.status).toBe(400);
      expect(response.body).toEqual(expect.objectContaining({
        message: 'Title and artist are required'
      }));
    });

    it('should handle optional fields being null', async () => {
      // Setup minimal song data
      const minimalSong = {
        title: 'Minimal Song',
        artist: 'Minimal Artist'
      };

      // Mock database response
      const createdSong = {
        id: 4,
        title: 'Minimal Song',
        artist: 'Minimal Artist',
        album: null,
        duration: null,
        image_url: null
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [createdSong],
        rowCount: 1
      });

      // Generate test token
      const token = generateTestToken();

      // Make request
      const response = await request(app)
        .post('/api/songs')
        .set('Authorization', `Bearer ${token}`)
        .send(minimalSong);

      // Assert response
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdSong);
      
      // Verify database was queried with correct data
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO songs (title, artist, album, duration, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [minimalSong.title, minimalSong.artist, null, null, null]
      );
    });

    it('should return 401 when not authenticated', async () => {
      // Setup song data
      const songData = {
        title: 'New Song',
        artist: 'New Artist'
      };

      // Make request without auth token
      const response = await request(app)
        .post('/api/songs')
        .send(songData);

      // Assert response
      expect(response.status).toBe(401);
      expect(response.body).toEqual(expect.objectContaining({
        message: expect.stringContaining('Unauthorized')
      }));
    });
  });
}); 