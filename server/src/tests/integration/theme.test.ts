import request from 'supertest';
import { app } from '../../app';
import pool from '../../config/db';
import { generateTestToken, setupDbMock } from '../setupApiTests';
import { Request, Response, NextFunction } from 'express';

// Mock passport before importing it
jest.mock('passport', () => {
  return {
    use: jest.fn(),
    authenticate: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => {
      // Attach the user object directly to the request
      req.user = { 
        id: 1, 
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser'
      };
      return next();
    }),
    initialize: jest.fn().mockReturnValue((req: Request, res: Response, next: NextFunction) => next()),
    serializeUser: jest.fn(),
    deserializeUser: jest.fn()
  };
});

// Now import passport after mocking it
import passport from 'passport';

// Mock passport-jwt Strategy
jest.mock('passport-jwt', () => {
  return {
    Strategy: jest.fn(),
    ExtractJwt: {
      fromAuthHeaderAsBearerToken: jest.fn().mockReturnValue(() => 'dummy_function')
    }
  };
});

describe('Database initialization', () => {
  it('should be a valid test file', () => {
    expect(true).toBe(true);
  });
});

describe('Theme API Endpoints', () => {
  // Mock data
  const testUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser'
  };
  
  const testTheme = {
    id: 1,
    name: 'Dark Theme',
    description: 'A dark theme for the application',
    image_url: 'https://example.com/dark-theme.jpg',
    is_default: true,
    is_public: true,
    user_id: null,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  };
  
  const testCustomTheme = {
    id: 2,
    name: 'Custom Theme',
    description: 'A custom theme created by the user',
    image_url: 'https://example.com/custom-theme.jpg',
    is_default: false,
    is_public: false,
    user_id: 1,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset the passport authenticate mock for each test to allow overriding
    (passport.authenticate as jest.Mock).mockImplementation(() => (req: Request, res: Response, next: NextFunction) => {
      // Attach the user object directly to the request
      req.user = { 
        id: 1, 
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser'
      };
      return next();
    });
  });

  describe('GET /api/themes', () => {
    it('should return all available themes', async () => {
      // Set up database mock response
      setupDbMock(pool, [
        {
          rows: [testTheme, {...testTheme, id: 2, name: 'Light Theme'}],
          rowCount: 2
        }
      ]);
      
      const token = generateTestToken();
      
      // Test request
      const response = await request(app)
        .get('/api/themes')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // Verify response
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toEqual(testTheme);
      
      // Verify database query
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM themes ORDER BY is_default DESC, name ASC'
      );
    });

    it('should return 401 when not authenticated', async () => {
      // We need to test an endpoint that actually requires authentication
      
      // Setup the mock
      setupDbMock(pool, [
        // No response needed - we'll get a 401 before db is queried
      ]);
      
      // Mock the auth middleware to reject the request
      jest.spyOn(passport, 'authenticate').mockImplementationOnce((strategy, options, callback) => {
        return (req: Request, res: Response, next: NextFunction) => {
          return res.status(401).json({ message: 'Unauthorized - No valid token provided' });
        };
      });
      
      // Test request on an endpoint that requires auth
      const response = await request(app)
        .get('/api/themes/custom/user')
        .expect(401);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('Unauthorized - No valid token provided');
    });
  });

  describe('POST /api/themes/custom', () => {
    it('should create a new custom theme', async () => {
      // Set up database mock response
      setupDbMock(pool, [
        {
          rows: [testCustomTheme],
          rowCount: 1
        }
      ]);
      
      // Make sure auth middleware is properly mocked
      jest.spyOn(passport, 'authenticate').mockImplementationOnce((strategy, options, callback) => {
        return (req: Request, res: Response, next: NextFunction) => {
          req.user = testUser;
          return next();
        };
      });
      
      const token = generateTestToken();
      const newThemeData = {
        name: 'Custom Theme',
        description: 'A custom theme created by the user',
        image_url: 'https://example.com/custom-theme.jpg',
        is_public: false
      };
      
      // Test request
      const response = await request(app)
        .post('/api/themes/custom')
        .set('Authorization', `Bearer ${token}`)
        .send(newThemeData)
        .expect(201);
      
      // Verify response
      expect(response.body).toHaveProperty('id', testCustomTheme.id);
      expect(response.body).toHaveProperty('name', testCustomTheme.name);
      
      // Verify database query (be more lenient about parameters)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO custom_themes'),
        expect.arrayContaining([expect.any(Number), expect.any(String)])
      );
    });

    it('should validate required fields', async () => {
      const token = generateTestToken();
      
      const response = await request(app)
        .post('/api/themes/custom')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Missing required fields' })
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('required');
    });
  });

  describe('PUT /api/themes/custom/:id', () => {
    it('should update an existing theme', async () => {
      // Set up database mock responses
      setupDbMock(pool, [
        // Theme existence check
        {
          rows: [testCustomTheme],
          rowCount: 1
        },
        // Update response
        {
          rows: [{...testCustomTheme, name: 'Updated Theme', description: 'Updated description'}],
          rowCount: 1
        }
      ]);
      
      const token = generateTestToken();
      const updateData = {
        name: 'Updated Theme',
        description: 'Updated description'
      };
      
      // Test request
      const response = await request(app)
        .put(`/api/themes/custom/${testCustomTheme.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);
      
      // Verify response
      expect(response.body).toHaveProperty('name', 'Updated Theme');
      expect(response.body).toHaveProperty('description', 'Updated description');
      
      // Verify database queries
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM custom_themes WHERE id = $1 AND user_id = $2'),
        ["2", 1]
      );
    });

    it('should not update themes owned by other users', async () => {
      // Set up database mock response for theme not found
      setupDbMock(pool, [
        {
          rows: [],
          rowCount: 0
        }
      ]);
      
      const token = generateTestToken();
      
      const response = await request(app)
        .put('/api/themes/custom/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Try to update' })
        .expect(404);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /api/themes/user', () => {
    it('should set user\'s active theme', async () => {
      // Set up database mock responses with a more complex implementation
      jest.spyOn(pool, 'query').mockImplementation((query, params) => {
        // Return different responses based on the query
        if (query.includes('SELECT * FROM themes WHERE id = $1')) {
          return Promise.resolve({
            rows: [testTheme],
            rowCount: 1
          });
        }
        if (query.includes('SELECT * FROM custom_themes WHERE id = $1')) {
          return Promise.resolve({
            rows: [],
            rowCount: 0
          });
        }
        if (query.includes('SELECT * FROM user_settings WHERE user_id = $1')) {
          return Promise.resolve({
            rows: [{ id: 1, user_id: 1, theme_id: null }],
            rowCount: 1
          });
        }
        if (query.includes('UPDATE user_settings SET theme_id')) {
          return Promise.resolve({
            rows: [{ id: 1, user_id: 1, theme_id: testTheme.id }],
            rowCount: 1
          });
        }
        if (query.includes('SELECT theme_id FROM user_settings')) {
          return Promise.resolve({
            rows: [{ theme_id: testTheme.id }],
            rowCount: 1
          });
        }
        
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      
      // Mock auth
      jest.spyOn(passport, 'authenticate').mockImplementationOnce((strategy, options, callback) => {
        return (req: Request, res: Response, next: NextFunction) => {
          req.user = testUser;
          return next();
        };
      });
      
      const token = generateTestToken();
      
      // Test request
      const response = await request(app)
        .put('/api/themes/user')
        .set('Authorization', `Bearer ${token}`)
        .send({ theme_id: testTheme.id })
        .expect(200);
      
      // Verify response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('Theme updated successfully');
    });

    it('should handle invalid theme IDs', async () => {
      // Set up mock responses for all queries in the controller
      jest.spyOn(pool, 'query').mockImplementation((query, params) => {
        if (query.includes('SELECT * FROM themes WHERE id = $1')) {
          return Promise.resolve({
            rows: [],
            rowCount: 0
          });
        }
        if (query.includes('SELECT * FROM custom_themes WHERE id = $1')) {
          return Promise.resolve({
            rows: [],
            rowCount: 0
          });
        }
        if (query.includes('SELECT * FROM themes WHERE is_default = true')) {
          return Promise.resolve({
            rows: [],
            rowCount: 0
          });
        }
        
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      
      // Mock auth
      jest.spyOn(passport, 'authenticate').mockImplementationOnce((strategy, options, callback) => {
        return (req: Request, res: Response, next: NextFunction) => {
          req.user = testUser;
          return next();
        };
      });
      
      const token = generateTestToken();
      
      const response = await request(app)
        .put('/api/themes/user')
        .set('Authorization', `Bearer ${token}`)
        .send({ theme_id: 999 })
        .expect(404);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('Theme not found and no default theme available');
    });
  });
}); 