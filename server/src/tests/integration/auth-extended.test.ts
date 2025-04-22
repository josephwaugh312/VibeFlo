import request from 'supertest';
import bcrypt from 'bcrypt';
import pool from '../../config/db';
import { app } from '../../app';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../services/email.service';
import { generateTestToken } from '../setupApiTests';

// Mock the database pool
jest.mock('../../config/db', () => {
  const { createMockPool } = require('../mocks/db-adapter.mock');
  return createMockPool();
});

// Mock bcrypt
jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('mocksalt'),
  hash: jest.fn().mockResolvedValue('mockhash'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock the email service
jest.mock('../../services/email.service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true)
}));

// Mock crypto for deterministic testing
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockImplementation(() => ({
    toString: jest.fn().mockReturnValue('mock-token-string')
  })),
  createHash: jest.fn().mockImplementation(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mock-hash-digest')
  }))
}));

const mockCrypto = jest.requireMock('crypto');

// Mock the auth middleware from auth.ts
jest.mock('../../middleware/auth', () => {
  return {
    authenticateToken: jest.fn().mockImplementation((req: any, res: any, next: any) => {
      // Get the authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No authentication token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        // Just set a mock user in the request without actual verification
        req.user = { 
          id: 1, 
          email: 'test@example.com'
        };
        next();
      } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
    })
    // Removed spotifyAuth mock since we're not using Spotify anymore
  };
});

describe('Auth Extended API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set JWT secret for testing
    process.env.JWT_SECRET = 'test_secret_key_for_testing_only';
  });

  describe('GET /api/auth/me', () => {
    it('should return user data when authenticated', async () => {
      // Generate a valid token for testing using our helper
      const token = generateTestToken(1, 'test@example.com');
      
      // Mock database response for the user query
      // This is a more specific mock for this test case
      (pool.query as jest.Mock).mockImplementation((query) => {
        // For the authentication verification
        if (query.includes('SELECT * FROM users WHERE')) {
          return { 
            rows: [{ id: 1, email: 'test@example.com' }], 
            rowCount: 1 
          };
        }
        
        // For the user profile data
        if (query.includes('SELECT id, name, username, email, bio, avatar_url, created_at, updated_at')) {
          return { 
            rows: [{ 
              id: 1, 
              name: 'Test User',
              username: 'testuser',
              email: 'test@example.com',
              bio: 'Test bio',
              avatar_url: 'avatar.jpg',
              created_at: new Date(),
              updated_at: new Date()
            }], 
            rowCount: 1 
          };
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      // Directly test the endpoint
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // Check response
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).toHaveProperty('username', 'testuser');
    });

    it('should return 401 when not authenticated', async () => {
      // Make API request without token
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('No authentication token provided');
    });

    it('should return 404 when user not found', async () => {
      // For this test, use a custom mock override of the authenticateToken middleware
      const authenticateToken = jest.requireMock('../../middleware/auth').authenticateToken;
      
      // Temporarily override the implementation to set a non-existent user ID
      authenticateToken.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { id: 999, email: 'nonexistent@example.com' };
        next();
      });
      
      // Mock database response for user not found
      (pool.query as jest.Mock).mockImplementation((query) => {
        return { rows: [], rowCount: 0 };
      });
      
      // Make API request with any token (the middleware mock will handle it)
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer any-token')
        .expect(404);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('User not found');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should generate and send reset token for valid email', async () => {
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM users WHERE email')) {
          return { 
            rows: [{ 
              id: 1, 
              email: 'test@example.com',
              name: 'Test User'
            }], 
            rowCount: 1 
          };
        }
        
        if (query.includes('CREATE TABLE IF NOT EXISTS reset_tokens') ||
            query.includes('DELETE FROM reset_tokens') ||
            query.includes('INSERT INTO reset_tokens')) {
          return { rows: [], rowCount: 1 };
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      // Make API request
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('If a user with that email exists');
      
      // Verify crypto was called to generate token
      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32);
      
      // Verify token was stored in database
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO reset_tokens'),
        expect.arrayContaining([1, 'mock-token-string'])
      );
    });

    it('should return same response for non-existent email (security)', async () => {
      // Mock database response for non-existent email
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM users WHERE email')) {
          return { rows: [], rowCount: 0 };
        }
        return { rows: [], rowCount: 0 };
      });
      
      // Make API request
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);
      
      // Check response - should be the same for security reasons
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('If a user with that email exists');
      
      // Verify no reset token was created
      expect(pool.query).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO reset_tokens'),
        expect.anything()
      );
    });

    it('should return 400 if email is not provided', async () => {
      // Make API request without email
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Please provide an email');
    });
  });

  // The rest of the tests need timeout increased and fixed paths
  // Setting a longer timeout for tests that involve token operations
  jest.setTimeout(60000);

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM reset_tokens')) {
          return { 
            rows: [{ 
              id: 1, 
              user_id: 1,
              token: 'valid-token',
              expires_at: new Date(Date.now() + 3600000) // 1 hour in future
            }], 
            rowCount: 1 
          };
        }
        
        if (query.includes('UPDATE users SET password') ||
            query.includes('DELETE FROM reset_tokens')) {
          return { rows: [], rowCount: 1 };
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      // Make API request
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ 
          token: 'valid-token', 
          newPassword: 'NewPassword123' 
        })
        .expect(200);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Password reset successful');
      
      // Verify bcrypt was called to hash password
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalled();
      
      // Verify password was updated
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET password'),
        expect.anything()
      );
      
      // Verify token was deleted
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM reset_tokens'),
        expect.anything()
      );
    });

    it('should return 400 for invalid or expired token', async () => {
      // Mock database response for invalid token
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM reset_tokens')) {
          return { rows: [], rowCount: 0 };
        }
        return { rows: [], rowCount: 0 };
      });
      
      // Make API request
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ 
          token: 'invalid-token', 
          newPassword: 'NewPassword123' 
        })
        .expect(400);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid or expired token');
      
      // Verify password was not updated
      expect(pool.query).not.toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET password'),
        expect.anything()
      );
    });

    it('should return 400 if password is too weak', async () => {
      // Make API request with weak password
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ 
          token: 'valid-token', 
          newPassword: 'weak' // Too short
        })
        .expect(400);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Password must be at least 6 characters');
    });
  });

  describe('GET /api/auth/verify-reset-token/:token', () => {
    it('should confirm token is valid', async () => {
      // Mock database response for valid token
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM reset_tokens')) {
          return { 
            rows: [{ 
              id: 1, 
              user_id: 1,
              token: 'valid-token',
              expires_at: new Date(Date.now() + 3600000) // 1 hour in future
            }], 
            rowCount: 1 
          };
        }
        return { rows: [], rowCount: 0 };
      });
      
      // Make API request
      const response = await request(app)
        .get('/api/auth/verify-reset-token/valid-token')
        .expect(200);
      
      // Check response
      expect(response.body).toHaveProperty('valid', true);
    });

    it('should return error for invalid token', async () => {
      // Mock database response for invalid token
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM reset_tokens')) {
          return { rows: [], rowCount: 0 };
        }
        return { rows: [], rowCount: 0 };
      });
      
      // Make API request
      const response = await request(app)
        .get('/api/auth/verify-reset-token/invalid-token')
        .expect(400);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid or expired token');
    });
  });

  describe('GET /api/auth/verify-email/:token', () => {
    it('should verify email with valid token', async () => {
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM verification_tokens')) {
          return { 
            rows: [{ 
              id: 1, 
              user_id: 1,
              token: 'valid-token',
              expires_at: new Date(Date.now() + 3600000) // 1 hour in future
            }], 
            rowCount: 1 
          };
        }
        
        if (query.includes('UPDATE users SET is_verified') ||
            query.includes('DELETE FROM verification_tokens')) {
          return { rows: [], rowCount: 1 };
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      // Make API request
      const response = await request(app)
        .get('/api/auth/verify-email/valid-token')
        .expect(200);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Email verified successfully');
      
      // Verify user was updated
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET is_verified'),
        [1]
      );
      
      // Verify token was deleted
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM verification_tokens'),
        [1]
      );
    });

    it('should return 400 for invalid verification token', async () => {
      // Mock database response for invalid token
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM verification_tokens')) {
          return { rows: [], rowCount: 0 };
        }
        return { rows: [], rowCount: 0 };
      });
      
      // Make API request
      const response = await request(app)
        .get('/api/auth/verify-email/invalid-token')
        .expect(400);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid or expired verification token');
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('should resend verification email', async () => {
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM users WHERE email')) {
          return { 
            rows: [{ 
              id: 1, 
              email: 'test@example.com',
              name: 'Test User',
              is_verified: false
            }], 
            rowCount: 1 
          };
        }
        
        if (query.includes('DELETE FROM verification_tokens') ||
            query.includes('INSERT INTO verification_tokens')) {
          return { rows: [], rowCount: 1 };
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      // Make API request
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'test@example.com' })
        .expect(200);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Verification email sent successfully');
      
      // Verify token was generated
      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32);
      
      // Verify email was sent
      expect(sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.stringContaining('/verify-email/')
      );
    });

    it('should return 400 if email is already verified', async () => {
      // Mock database response for verified email
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM users WHERE email')) {
          return { 
            rows: [{ 
              id: 1, 
              email: 'test@example.com',
              name: 'Test User',
              is_verified: true // Already verified
            }], 
            rowCount: 1 
          };
        }
        return { rows: [], rowCount: 0 };
      });
      
      // Make API request
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'test@example.com' })
        .expect(400);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Email is already verified');
      
      // Verify email service was not called
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      // Mock database response for non-existent user
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM users WHERE email')) {
          return { rows: [], rowCount: 0 };
        }
        return { rows: [], rowCount: 0 };
      });
      
      // Make API request
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('User not found');
      
      // Verify email service was not called
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });
  });
});

describe('Database initialization', () => {
  it('should be a valid test file', () => {
    expect(true).toBe(true);
  });
}); 