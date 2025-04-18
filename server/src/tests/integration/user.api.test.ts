import request from 'supertest';
import bcrypt from 'bcrypt';
import pool from '../../config/db';
import { app } from '../../app';
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

describe('User API Endpoints', () => {
  // Mock data
  const testUser = {
    id: 1,
    name: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    bio: 'Test bio',
    avatar_url: 'https://example.com/avatar.jpg',
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

  describe('GET /api/users/me', () => {
    it('should return the user profile when authenticated', async () => {
      // Set up database mock response
      setupDbMock(pool, [
        {
          rows: [testUser],
          rowCount: 1
        }
      ]);
      
      const token = generateTestToken();
      
      // Test request
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // Verify response structure
      expect(response.body).toEqual(testUser);
      
      // Verify database was queried correctly
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1] // user ID
      );
    });

    it('should return 401 when not authenticated', async () => {
      // Override the passport mock just for this test
      (passport.authenticate as jest.Mock).mockImplementationOnce(() => (req: Request, res: Response, next: NextFunction) => {
        return res.status(401).json({ message: 'Unauthorized' });
      });
      
      const response = await request(app)
        .get('/api/users/me')
        .expect(401);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Unauthorized');
    });

    it('should return 404 when user not found', async () => {
      // Set up database mock response for no user found
      setupDbMock(pool, [
        {
          rows: [],
          rowCount: 0
        }
      ]);
      
      const token = generateTestToken();
      
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /api/users/me', () => {
    const updateData = {
      name: 'Updated Name',
      username: 'updateduser',
      bio: 'Updated bio'
    };

    it('should update the user profile successfully', async () => {
      // Set up database mock response with pattern matching
      setupDbMock(pool, {
        'username = $1': {
          rows: [], // No duplicate username found
          rowCount: 0
        },
        'UPDATE users': {
          rows: [{
            ...testUser,
            name: updateData.name,
            username: updateData.username,
            bio: updateData.bio
          }],
          rowCount: 1
        }
      });
      
      const token = generateTestToken();
      
      // Test request
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);
      
      // Verify response
      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('username', updateData.username);
      expect(response.body).toHaveProperty('bio', updateData.bio);
    });

    it('should reject update with invalid username format', async () => {
      const token = generateTestToken();
      
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...updateData,
          username: 'invalid@username'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Username');
    });

    it('should reject update with bio that exceeds max length', async () => {
      const token = generateTestToken();
      
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...updateData,
          bio: 'a'.repeat(151) // Bio longer than 150 chars
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Bio cannot exceed');
    });

    it('should reject update if username is already taken', async () => {
      // Set up database mock response for username check
      setupDbMock(pool, [
        {
          rows: [{ id: 2 }], // Another user has this username
          rowCount: 1
        }
      ]);
      
      const token = generateTestToken();
      
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already taken');
    });
  });

  describe('POST /api/users/password', () => {
    it('should change password successfully with valid credentials', async () => {
      // Create a real hash for testing
      const hash = await bcrypt.hash('currentPassword123', 10);
      
      // Set up database mock responses
      setupDbMock(pool, [
        // First query - get user with password
        {
          rows: [{
            id: 1,
            password: hash
          }],
          rowCount: 1
        },
        // Second query - update password
        {
          rows: [],
          rowCount: 1
        }
      ]);
      
      const token = generateTestToken();
      
      const response = await request(app)
        .post('/api/users/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'currentPassword123',
          newPassword: 'NewPassword123'
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('successfully');
      
      // Verify password update query was called
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET password'),
        expect.any(Array)
      );
    });

    it('should reject with incorrect current password', async () => {
      // Create a real hash for testing
      const hash = await bcrypt.hash('correctPassword123', 10);
      
      // Set up database mock response for user lookup
      setupDbMock(pool, [
        {
          rows: [{
            id: 1,
            password: hash
          }],
          rowCount: 1
        }
      ]);
      
      const token = generateTestToken();
      
      const response = await request(app)
        .post('/api/users/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongPassword123',
          newPassword: 'NewPassword123'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('incorrect');
    });

    it('should reject weak new password', async () => {
      // Create a real hash for testing
      const hash = await bcrypt.hash('currentPassword123', 10);
      
      // Set up database mock response for user lookup
      setupDbMock(pool, [
        {
          rows: [{
            id: 1,
            password: hash
          }],
          rowCount: 1
        }
      ]);
      
      const token = generateTestToken();
      
      const response = await request(app)
        .post('/api/users/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'currentPassword123',
          newPassword: 'weak'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('at least 8 characters');
    });
  });
}); 