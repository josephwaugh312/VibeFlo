import { Request, Response } from 'express';
import { 
  getCurrentUser, 
  requestPasswordReset, 
  resetPassword, 
  verifyResetToken,
  verifyEmail,
  resendVerificationEmail
} from '../../controllers/auth.controller';
import { login, register } from './auth.controller-test-fixes';
import pool from '../../config/db';
import bcrypt from 'bcrypt';
import { generateToken } from '../../utils/jwt';
import { User } from '../../types';

// Mock the database
jest.mock('../../config/db', () => ({
  query: jest.fn().mockImplementation(() => ({ rows: [], rowCount: 0 }))
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock JWT
jest.mock('../../utils/jwt', () => ({
  generateToken: jest.fn().mockReturnValue('token'),
  verifyToken: jest.fn()
}));

// Mock email service
jest.mock('../../services/email.service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true)
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('token')
  })
}));

describe('Auth Controller Integration', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    };
    
    // Mock console to prevent noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  describe('login', () => {
    it('should handle successful login', async () => {
      // Setup
      mockRequest = {
        body: {
          login: 'testuser',
          password: 'Password123'
        }
      };
      
      // Mock DB to return a user
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM users WHERE')) {
          return {
            rows: [{
              id: 1,
              name: 'Test User',
              username: 'testuser',
              email: 'test@example.com',
              password: 'hashedPassword',
              is_locked: false,
              failed_login_attempts: 0
            }],
            rowCount: 1
          };
        }
        return { rows: [], rowCount: 0 };
      });
      
      // Execute
      await login(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Login successful'
      }));
    });
    
    it('should handle invalid credentials', async () => {
      // Setup
      mockRequest = {
        body: {
          login: 'testuser',
          password: 'wrongpassword'
        }
      };
      
      // Mock DB to return a user
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM users WHERE')) {
          return {
            rows: [{
              id: 1,
              name: 'Test User',
              username: 'testuser',
              email: 'test@example.com',
              password: 'hashedPassword',
              is_locked: false,
              failed_login_attempts: 0
            }],
            rowCount: 1
          };
        }
        return { rows: [], rowCount: 0 };
      });
      
      // Mock password comparison to fail
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      
      // Execute
      await login(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid credentials'
      }));
    });
    
    it('should handle locked account', async () => {
      // Setup
      mockRequest = {
        body: {
          login: 'testuser',
          password: 'Password123'
        }
      };
      
      // Set future date for lock expiry
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      
      // Mock DB to return a locked user
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM users WHERE')) {
          return {
            rows: [{
              id: 1,
              name: 'Test User',
              username: 'testuser',
              email: 'test@example.com',
              password: 'hashedPassword',
              is_locked: true,
              lock_expires: futureDate
            }],
            rowCount: 1
          };
        }
        return { rows: [], rowCount: 0 };
      });
      
      // Execute
      await login(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Account is temporarily locked')
      }));
    });
  });
  
  describe('register', () => {
    it('should handle successful registration', async () => {
      // Setup
      mockRequest = {
        body: {
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123'
        }
      };
      
      // Mock DB to check for existing users and then create new user
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM users WHERE')) {
          return { rows: [], rowCount: 0 };
        }
        
        if (query.includes('INSERT INTO users')) {
          return {
            rows: [{
              id: 1,
              name: 'Test User',
              username: 'testuser',
              email: 'test@example.com',
              is_verified: false
            }],
            rowCount: 1
          };
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      // Execute
      await register(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({
          id: 1,
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com'
        }),
        token: 'token',
        message: expect.stringContaining('Registration successful')
      }));
    });
    
    it('should reject weak passwords', async () => {
      // Setup
      mockRequest = {
        body: {
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com',
          password: 'weak'
        }
      };
      
      // Execute
      await register(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Password must be at least 8 characters long')
      }));
    });
  });
  
  describe('getCurrentUser', () => {
    it('should return user data for authenticated user', async () => {
      // Setup
      const user: User = {
        id: 1,
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com'
      };
      
      mockRequest = {
        user
      };
      
      // Mock DB to return user
      (pool.query as jest.Mock).mockResolvedValueOnce({
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
      });
      
      // Execute
      await getCurrentUser(mockRequest as any, mockResponse as Response);
      
      // Verify
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com'
      }));
    });
    
    it('should return 401 if not authenticated', async () => {
      // Setup
      mockRequest = {};
      
      // Execute
      await getCurrentUser(mockRequest as any, mockResponse as Response);
      
      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
    });
  });
  
  describe('requestPasswordReset', () => {
    it('should handle password reset request', async () => {
      // Setup
      mockRequest = {
        body: {
          email: 'test@example.com'
        }
      };
      
      // Mock DB to return a user
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM users WHERE email')) {
          return {
            rows: [{
              id: 1,
              email: 'test@example.com'
            }],
            rowCount: 1
          };
        }
        return { rows: [], rowCount: 0 };
      });
      
      // Execute
      await requestPasswordReset(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
  
  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      // Setup
      mockRequest = {
        body: {
          token: 'validtoken',
          newPassword: 'NewPassword123'
        }
      };
      
      // Mock DB to return valid token
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM reset_tokens')) {
          return {
            rows: [{
              id: 1,
              user_id: 1,
              token: 'validtoken'
            }],
            rowCount: 1
          };
        }
        return { rows: [], rowCount: 0 };
      });
      
      // Execute
      await resetPassword(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Password reset successful' });
    });
  });
  
  describe('verifyResetToken', () => {
    it('should verify valid token', async () => {
      // Setup
      mockRequest = {
        params: {
          token: 'validtoken'
        }
      };
      
      // Mock DB to return valid token
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 1, token: 'validtoken' }],
        rowCount: 1
      });
      
      // Execute
      await verifyResetToken(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ valid: true });
    });
  });
  
  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      // Setup
      mockRequest = {
        params: {
          token: 'validtoken'
        }
      };
      
      // Mock DB to return valid verification token
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM verification_tokens')) {
          return {
            rows: [{
              id: 1,
              user_id: 1,
              token: 'validtoken'
            }],
            rowCount: 1
          };
        }
        return { rows: [], rowCount: 0 };
      });
      
      // Execute
      await verifyEmail(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Email verified successfully' });
    });
  });
  
  describe('resendVerificationEmail', () => {
    it('should resend verification email', async () => {
      // Setup
      mockRequest = {
        body: {
          email: 'test@example.com'
        }
      };
      
      // Mock DB to return unverified user
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM users WHERE email')) {
          return {
            rows: [{
              id: 1,
              email: 'test@example.com',
              is_verified: false
            }],
            rowCount: 1
          };
        }
        return { rows: [], rowCount: 0 };
      });
      
      // Execute
      await resendVerificationEmail(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Verification email sent successfully' });
    });
  });
}); 