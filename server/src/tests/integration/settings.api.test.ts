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

describe('Settings API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/settings', () => {
    it('should return user settings when authenticated', async () => {
      // Mock database response for existing settings
      const mockSettings = {
        id: 1,
        user_id: 1,
        pomodoro_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        pomodoros_until_long_break: 4,
        auto_start_breaks: true,
        auto_start_pomodoros: false,
        dark_mode: true,
        sound_enabled: true,
        notification_enabled: true
      };

      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM user_settings WHERE user_id')) {
          return Promise.resolve({
            rows: [mockSettings],
            rowCount: 1
          });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      // Generate test token
      const token = generateTestToken(1);

      // Make request
      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${token}`);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSettings);
      
      // Verify database was queried with correct user ID
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM user_settings WHERE user_id = $1',
        [1]
      );
    });

    it('should create default settings if user has no settings', async () => {
      // Mock database responses
      const mockNewSettings = {
        id: 1,
        user_id: 1,
        pomodoro_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        pomodoros_until_long_break: 4
      };

      let queryCount = 0;
      (pool.query as jest.Mock).mockImplementation((query) => {
        queryCount++;
        
        if (queryCount === 1) {
          // First call - check for existing settings
          return Promise.resolve({
            rows: [],
            rowCount: 0
          });
        } else if (queryCount === 2) {
          // Second call - insert default settings
          return Promise.resolve({
            rows: [mockNewSettings],
            rowCount: 1
          });
        }
        
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      // Generate test token
      const token = generateTestToken(1);

      // Make request
      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${token}`);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNewSettings);
      
      // Verify database was queried twice
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(pool.query).toHaveBeenNthCalledWith(1, 
        'SELECT * FROM user_settings WHERE user_id = $1',
        [1]
      );
      expect(pool.query).toHaveBeenNthCalledWith(2, 
        expect.stringContaining('INSERT INTO user_settings'),
        [1]
      );
    });

    it('should return 401 when not authenticated', async () => {
      // Make request without auth token
      const response = await request(app)
        .get('/api/settings');

      // Assert response
      expect(response.status).toBe(401);
      expect(response.body).toEqual(expect.objectContaining({
        message: expect.stringContaining('Unauthorized')
      }));
    });
  });

  describe('PUT /api/settings', () => {
    it('should update user settings when authenticated', async () => {
      // Create settings to update
      const settingsUpdate = {
        pomodoro_duration: 30,
        short_break_duration: 10,
        long_break_duration: 20,
        pomodoros_until_long_break: 3,
        auto_start_breaks: false,
        auto_start_pomodoros: true,
        dark_mode: true,
        sound_enabled: false,
        notification_enabled: true
      };

      // Mock database responses
      const existingSettings = {
        id: 1,
        user_id: 1,
        pomodoro_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        pomodoros_until_long_break: 4,
        auto_start_breaks: true,
        auto_start_pomodoros: false,
        dark_mode: false,
        sound_enabled: true,
        notification_enabled: true
      };

      const updatedSettings = {
        ...existingSettings,
        ...settingsUpdate,
        updated_at: "2025-04-18T00:30:29.782Z" // Use string format for date
      };

      let queryCount = 0;
      (pool.query as jest.Mock).mockImplementation((query) => {
        queryCount++;
        
        if (queryCount === 1) {
          // First call - check for existing settings
          return Promise.resolve({
            rows: [existingSettings],
            rowCount: 1
          });
        } else if (queryCount === 2) {
          // Second call - update settings
          return Promise.resolve({
            rows: [updatedSettings],
            rowCount: 1
          });
        }
        
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      // Generate test token
      const token = generateTestToken(1);

      // Make request
      const response = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${token}`)
        .send(settingsUpdate);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedSettings);
      
      // Verify database was queried twice
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(pool.query).toHaveBeenNthCalledWith(1, 
        'SELECT * FROM user_settings WHERE user_id = $1',
        [1]
      );
      expect(pool.query).toHaveBeenNthCalledWith(2, 
        expect.stringContaining('UPDATE user_settings SET'),
        expect.arrayContaining([1]) // Should include user_id
      );
    });

    it('should create new settings if user has no settings', async () => {
      // Create settings to create
      const newSettings = {
        pomodoro_duration: 30,
        short_break_duration: 10,
        long_break_duration: 20,
        pomodoros_until_long_break: 3,
        auto_start_breaks: false,
        auto_start_pomodoros: true,
        dark_mode: true,
        sound_enabled: false,
        notification_enabled: true
      };

      // Mock database responses
      const createdSettings = {
        id: 1,
        user_id: 1,
        ...newSettings
      };

      let queryCount = 0;
      (pool.query as jest.Mock).mockImplementation((query) => {
        queryCount++;
        
        if (queryCount === 1) {
          // First call - check for existing settings (none found)
          return Promise.resolve({
            rows: [],
            rowCount: 0
          });
        } else if (queryCount === 2) {
          // Second call - insert new settings
          return Promise.resolve({
            rows: [createdSettings],
            rowCount: 1
          });
        }
        
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      // Generate test token
      const token = generateTestToken(1);

      // Make request
      const response = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${token}`)
        .send(newSettings);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(createdSettings);
      
      // Verify database was queried twice
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(pool.query).toHaveBeenNthCalledWith(1, 
        'SELECT * FROM user_settings WHERE user_id = $1',
        [1]
      );
      expect(pool.query).toHaveBeenNthCalledWith(2, 
        expect.stringContaining('INSERT INTO user_settings'),
        expect.arrayContaining([1]) // Should include user_id
      );
    });

    it('should validate pomodoro_duration range', async () => {
      // Invalid pomodoro durations
      const tooLong = { pomodoro_duration: 65 }; // > 60
      const tooShort = { pomodoro_duration: 0 }; // < 1
      
      // Generate test token
      const token = generateTestToken(1);

      // Test too long duration
      const responseTooLong = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${token}`)
        .send(tooLong);

      expect(responseTooLong.status).toBe(400);
      expect(responseTooLong.body).toEqual(expect.objectContaining({
        message: expect.stringContaining('Pomodoro duration must be between 1 and 60 minutes')
      }));

      // Test too short duration
      const responseTooShort = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${token}`)
        .send(tooShort);

      expect(responseTooShort.status).toBe(400);
      expect(responseTooShort.body).toEqual(expect.objectContaining({
        message: expect.stringContaining('Pomodoro duration must be between 1 and 60 minutes')
      }));
    });

    it('should validate short_break_duration range', async () => {
      // Invalid short break duration
      const tooLong = { short_break_duration: 35 }; // > 30
      
      // Generate test token
      const token = generateTestToken(1);

      // Test too long short break
      const response = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${token}`)
        .send(tooLong);

      expect(response.status).toBe(400);
      expect(response.body).toEqual(expect.objectContaining({
        message: expect.stringContaining('Short break duration must be between 1 and 30 minutes')
      }));
    });

    it('should validate long_break_duration range', async () => {
      // Invalid long break duration
      const tooLong = { long_break_duration: 65 }; // > 60
      
      // Generate test token
      const token = generateTestToken(1);

      // Test too long long break
      const response = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${token}`)
        .send(tooLong);

      expect(response.status).toBe(400);
      expect(response.body).toEqual(expect.objectContaining({
        message: expect.stringContaining('Long break duration must be between 1 and 60 minutes')
      }));
    });
    
    it('should validate pomodoros_until_long_break range', async () => {
      // Invalid pomodoro count
      const tooMany = { pomodoros_until_long_break: 12 }; // > 10
      
      // Generate test token
      const token = generateTestToken(1);

      // Test too many pomodoros
      const response = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${token}`)
        .send(tooMany);

      expect(response.status).toBe(400);
      expect(response.body).toEqual(expect.objectContaining({
        message: expect.stringContaining('Pomodoros until long break must be between 1 and 10')
      }));
    });

    it('should return 401 when not authenticated', async () => {
      // Make request without auth token
      const response = await request(app)
        .put('/api/settings')
        .send({ pomodoro_duration: 30 });

      // Assert response
      expect(response.status).toBe(401);
      expect(response.body).toEqual(expect.objectContaining({
        message: expect.stringContaining('Unauthorized')
      }));
    });
  });
}); 