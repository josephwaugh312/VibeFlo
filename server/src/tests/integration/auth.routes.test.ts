/// <reference types="jest" />

import { directApi } from '../helpers/direct-test-helper';
import * as jwt from 'jsonwebtoken';
import { setupIntegrationTestMocks, generateTestToken } from './setupIntegrationTests';
import { mockPool } from '../mocks/db-mock';

// Import Jest types
import { jest } from '@jest/globals';

// Set up mocks before any imports that use them
setupIntegrationTestMocks();

// Mock bcrypt properly to handle the mockResolvedValueOnce method
jest.mock('bcrypt', () => ({
  compare: jest.fn().mockImplementation(() => Promise.resolve(true)),
  hash: jest.fn().mockImplementation(() => Promise.resolve('hashed_password')),
  genSalt: jest.fn().mockImplementation(() => Promise.resolve('salt'))
}));

// Import bcrypt after mocking
import bcrypt from 'bcrypt';

// Mock JWT module
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked-jwt-token'),
  verify: jest.fn().mockReturnValue({ id: 1, email: 'test@example.com' })
}));

// Mock the email service
jest.mock('../../services/email.service', () => ({
  default: {
    sendVerificationEmail: jest.fn().mockImplementation(() => Promise.resolve(true)),
    sendPasswordResetEmail: jest.fn().mockImplementation(() => Promise.resolve(true)),
    sendWelcomeEmail: jest.fn().mockImplementation(() => Promise.resolve(true))
  }
}));

describe('Database initialization', () => {
  it('should be a valid test file', () => {
    expect(true).toBe(true);
  });
});

describe('Auth Routes', () => {
  // Test user data
  const testUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    password: 'Test123!',
    hashedPassword: 'hashed_password_123',
    is_verified: true
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockPool.reset();
    
    // Reset bcrypt compare to default behavior
    (bcrypt.compare as jest.Mock).mockImplementation(() => Promise.resolve(true));
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock the database responses
      mockPool.setQueryResponses([
        // Check if user exists - returns no rows
        { rows: [], rowCount: 0 },
        // Insert user - returns the new user
        { 
          rows: [{ 
            id: 2, 
            email: 'newuser@example.com', 
            username: 'newuser', 
            is_verified: false 
          }], 
          rowCount: 1 
        }
      ]);

      const newUser = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'Test123!'
      };

      const response = await directApi.post('/api/auth/register', newUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Registration successful');
      expect(response.body.user.email).toBe(newUser.email);
      expect(response.body.user.username).toBe(newUser.username);
    });

    it('should return 400 when email is already in use', async () => {
      // Mock database to return a user with the same email
      mockPool.setQueryResponses([
        { rows: [{ id: 1, email: 'duplicate@example.com' }], rowCount: 1 }
      ]);

      const duplicateEmailUser = {
        email: 'duplicate@example.com',
        username: 'newuser',
        password: 'Test123!'
      };

      const response = await directApi.post('/api/auth/register', duplicateEmailUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Email already in use');
    });

    it('should return 400 when username is already taken', async () => {
      // First response for email check - no user with that email
      // Second response for username check - user with that username exists
      mockPool.setQueryResponses([
        { rows: [], rowCount: 0 },
        { rows: [{ id: 1, username: 'takenuser' }], rowCount: 1 }
      ]);

      const duplicateUsernameUser = {
        email: 'newuser@example.com',
        username: 'takenuser',
        password: 'Test123!'
      };

      const response = await directApi.post('/api/auth/register', duplicateUsernameUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Username already taken');
    });

    it('should return 400 when required fields are missing', async () => {
      const incompleteUser = {
        email: 'newuser@example.com'
        // Missing username and password
      };

      const response = await directApi.post('/api/auth/register', incompleteUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with email and password', async () => {
      // Mock database response for successful login
      mockPool.setQueryResponses([
        { 
          rows: [testUser], 
          rowCount: 1 
        }
      ]);

      // Mock bcrypt.compare to return true for this specific test
      (bcrypt.compare as jest.Mock).mockImplementation(() => Promise.resolve(true));

      const loginData = {
        email: testUser.email,
        password: testUser.password
      };

      const response = await directApi.post('/api/auth/login', loginData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBe('mocked-jwt-token');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.username).toBe(testUser.username);
      expect(response.body.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should login successfully with username and password', async () => {
      // Mock database response for successful login with username
      mockPool.setQueryResponses([
        { 
          rows: [testUser], 
          rowCount: 1 
        }
      ]);

      // Mock bcrypt.compare to return true for this specific test
      (bcrypt.compare as jest.Mock).mockImplementation(() => Promise.resolve(true));

      const loginData = {
        login: testUser.username,
        password: testUser.password
      };

      const response = await directApi.post('/api/auth/login', loginData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
    });

    it('should return 401 for invalid credentials (wrong password)', async () => {
      // Mock database response to find the user
      mockPool.setQueryResponses([
        { 
          rows: [testUser], 
          rowCount: 1 
        }
      ]);

      // Mock bcrypt.compare to return false for this specific test (wrong password)
      (bcrypt.compare as jest.Mock).mockImplementation(() => Promise.resolve(false));

      const loginData = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      const response = await directApi.post('/api/auth/login', loginData);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      // Mock database to return no user
      mockPool.setQueryResponses([
        { rows: [], rowCount: 0 }
      ]);

      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await directApi.post('/api/auth/login', loginData);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 400 when required fields are missing', async () => {
      const incompleteLoginData = {
        // email is missing
        password: 'password123'
      };

      const response = await directApi.post('/api/auth/login', incompleteLoginData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user information with a valid token', async () => {
      // Mock database response to find the user
      mockPool.setQueryResponses([
        { 
          rows: [testUser], 
          rowCount: 1 
        }
      ]);

      // Generate a test token
      const token = generateTestToken();

      const response = await directApi.get('/api/auth/me', token);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.username).toBe(testUser.username);
      expect(response.body.password).toBeUndefined(); // Password should not be returned
    });

    it('should return 401 when no token is provided', async () => {
      const response = await directApi.get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Unauthorized');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send a password reset email for a valid user', async () => {
      // Mock database to return a user
      mockPool.setQueryResponses([
        {
          rows: [{ 
            id: 1, 
            email: 'test@example.com', 
            username: 'testuser',
            name: 'Test User'
          }],
          rowCount: 1
        },
        // Mock successful token insertion
        {
          rows: [{ id: 1 }],
          rowCount: 1
        }
      ]);

      const response = await directApi.post('/api/auth/forgot-password', {
        email: 'test@example.com'
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('If the email is registered, a password reset link has been sent');
    });

    it('should return a generic message for non-existent email to prevent user enumeration', async () => {
      // Mock database to return no user
      mockPool.setQueryResponses([
        { rows: [], rowCount: 0 }
      ]);

      const response = await directApi.post('/api/auth/forgot-password', {
        email: 'nonexistent@example.com'
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('If the email is registered, a password reset link has been sent');
    });

    it('should return 400 when email is not provided', async () => {
      const response = await directApi.post('/api/auth/forgot-password', {});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Email is required');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      // Mock token verification
      mockPool.setQueryResponses([
        // Mock token retrieval
        { 
          rows: [{ 
            id: 1, 
            user_id: 1,
            token: 'valid-token',
            expires_at: new Date(Date.now() + 3600000) // 1 hour from now
          }], 
          rowCount: 1 
        },
        // Mock password update
        { 
          rows: [], 
          rowCount: 1 
        },
        // Mock token deletion
        { 
          rows: [], 
          rowCount: 1 
        }
      ]);

      const response = await directApi.post('/api/auth/reset-password', {
        token: 'valid-token',
        newPassword: 'NewPassword123!'
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Password reset successful');
    });

    it('should return 400 for invalid token', async () => {
      // Mock no token found
      mockPool.setQueryResponses([
        { rows: [], rowCount: 0 }
      ]);

      const response = await directApi.post('/api/auth/reset-password', {
        token: 'invalid-token',
        newPassword: 'NewPassword123!'
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid or expired token');
    });

    it('should return 400 when token or new password is missing', async () => {
      const response = await directApi.post('/api/auth/reset-password', {
        // Missing token
        newPassword: 'NewPassword123!'
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Token and password are required');
    });

    it('should return 400 when new password is too short', async () => {
      const response = await directApi.post('/api/auth/reset-password', {
        token: 'valid-token',
        newPassword: 'short'
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Password must be at least 6 characters long');
    });
  });

  describe('GET /api/auth/verify-reset-token/:token', () => {
    it('should validate a valid reset token', async () => {
      // Mock token verification
      mockPool.setQueryResponses([
        { 
          rows: [{ 
            id: 1, 
            user_id: 1,
            token: 'valid-token',
            expires_at: new Date(Date.now() + 3600000) // 1 hour from now
          }], 
          rowCount: 1 
        }
      ]);

      const response = await directApi.get('/api/auth/verify-reset-token/valid-token');

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
    });

    it('should return 400 for an invalid reset token', async () => {
      // Mock no token found
      mockPool.setQueryResponses([
        { rows: [], rowCount: 0 }
      ]);

      const response = await directApi.get('/api/auth/verify-reset-token/invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid or expired token');
    });
  });

  describe('GET /api/auth/verification-status', () => {
    it('should return verification status for authenticated user', async () => {
      // Mock user response
      mockPool.setQueryResponses([
        { rows: [{ is_verified: true }], rowCount: 1 }
      ]);

      const token = generateTestToken();

      const response = await directApi.get('/api/auth/verification-status', token);

      expect(response.status).toBe(200);
      expect(response.body.isVerified).toBe(true);
    });

    it('should return 401 when no token is provided', async () => {
      const response = await directApi.get('/api/auth/verification-status');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('User not authenticated');
    });

    it('should return 404 when user is not found', async () => {
      // Mock empty result
      mockPool.setQueryResponses([
        { rows: [], rowCount: 0 }
      ]);

      // Create token that returns user-not-found in the test helper
      const token = 'user-not-found';

      const response = await directApi.get('/api/auth/verification-status', token);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('User not found');
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('should resend verification email for unverified user', async () => {
      // Mock database to find user and they're not verified
      mockPool.setQueryResponses([
        { 
          rows: [{ 
            id: 1, 
            email: 'test@example.com', 
            username: 'testuser',
            name: 'Test User',
            is_verified: false
          }], 
          rowCount: 1 
        },
        // Delete existing tokens
        { 
          rows: [], 
          rowCount: 0 
        },
        // Insert new token
        { 
          rows: [{ id: 1 }], 
          rowCount: 1 
        }
      ]);

      const response = await directApi.post('/api/auth/resend-verification', {
        email: 'test@example.com'
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Verification email sent successfully');
    });

    it('should return 400 if user is already verified', async () => {
      // Mock database to find user and they're already verified
      mockPool.setQueryResponses([
        { 
          rows: [{ 
            id: 1, 
            email: 'verified@example.com', 
            username: 'testuser',
            name: 'Test User',
            is_verified: true
          }], 
          rowCount: 1 
        }
      ]);

      const response = await directApi.post('/api/auth/resend-verification', {
        email: 'verified@example.com'
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Email is already verified');
    });

    it('should return 404 for non-existent email', async () => {
      // Mock database to return no user
      mockPool.setQueryResponses([
        { rows: [], rowCount: 0 }
      ]);

      const response = await directApi.post('/api/auth/resend-verification', {
        email: 'nonexistent@example.com'
      });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('User not found');
    });

    it('should return 400 when email is not provided', async () => {
      const response = await directApi.post('/api/auth/resend-verification', {});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Email is required');
    });
  });
}); 