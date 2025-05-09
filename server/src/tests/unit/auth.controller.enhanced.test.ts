import { Request, Response, NextFunction } from 'express';
import { resetPassword, verifyResetToken, verifyEmail, resendVerificationEmail, login, getCurrentUser, googleCallback, facebookCallback, checkVerificationStatus } from '../../controllers/auth.controller';
import bcrypt from 'bcrypt';
import pool from '../../config/db';
import { generateToken } from '../../utils/jwt';
import emailService from '../../services/email.service';

// Mock the database pool
jest.mock('../../config/db', () => ({
  query: jest.fn(),
  connect: jest.fn().mockReturnValue({
    query: jest.fn(),
    release: jest.fn()
  })
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('mockedSalt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockImplementation(async (password, hashedPassword) => {
    // For simulating different password scenarios
    if (password === 'wrongpassword') {
      return false;
    }
    return true;
  })
}));

// Mock JWT utils
jest.mock('../../utils/jwt', () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
  verifyToken: jest.fn().mockImplementation((token) => {
    if (token === 'valid-token') {
      return { id: 1, email: 'test@example.com' };
    }
    throw new Error('Invalid token');
  })
}));

// Mock email service
jest.mock('../../services/email.service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true)
}));

describe('Auth Controller - Enhanced Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      redirect: jest.fn()
    };
    
    // Create mock next function
    mockNext = jest.fn();
    
    // Suppress console logs and errors
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  describe('resetPassword', () => {
    beforeEach(() => {
      // Setup request with token and new password
      mockRequest = {
        body: {
          token: 'valid-reset-token',
          newPassword: 'NewPassword123'
        }
      };
      
      // Mock the database query for valid token
      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('SELECT * FROM reset_tokens')) {
          return {
            rows: [{
              id: 1,
              user_id: 1,
              token: 'valid-reset-token',
              expires_at: new Date(Date.now() + 3600000) // 1 hour in future
            }],
            rowCount: 1
          };
        }
        
        if (query.includes('UPDATE users SET password')) {
          return { rows: [], rowCount: 1 };
        }
        
        if (query.includes('DELETE FROM reset_tokens')) {
          return { rows: [], rowCount: 1 };
        }
        
        return { rows: [], rowCount: 0 };
      });
    });
    
    it('should reset password with valid token', async () => {
      await resetPassword(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify password was hashed
      expect(bcrypt.hash).toHaveBeenCalled();
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Password reset successful' })
      );
      
      // Verify database operations
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET password'),
        expect.arrayContaining(['hashedPassword', 1])
      );
      
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM reset_tokens'),
        expect.arrayContaining([1])
      );
    });
    
    it('should return 400 for invalid or expired token', async () => {
      // Mock database query for invalid token
      (pool.query as jest.Mock).mockImplementationOnce(() => {
        return { rows: [], rowCount: 0 };
      });
      
      await resetPassword(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid or expired token' })
      );
      
      // Verify no password update was performed
      expect(pool.query).not.toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET password'),
        expect.anything()
      );
    });
    
    it('should return 400 if password is too weak', async () => {
      // Setup request with weak password
      mockRequest = {
        body: {
          token: 'valid-reset-token',
          newPassword: 'weak'
        }
      };
      
      await resetPassword(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Password must be at least 6 characters long' })
      );
      
      // Verify no database operations were performed
      expect(pool.query).not.toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET password'),
        expect.anything()
      );
    });
    
    it('should return 400 if token or password are missing', async () => {
      // Setup request with missing data
      mockRequest = {
        body: {
          token: '', // Empty token
          newPassword: 'NewPassword123'
        }
      };
      
      await resetPassword(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Please provide a token and new password' })
      );
    });
  });
  
  describe('verifyResetToken', () => {
    it('should verify a valid reset token', async () => {
      // Setup request with valid token
      mockRequest = {
        params: {
          token: 'valid-reset-token'
        }
      };
      
      // Mock the database query for valid token
      (pool.query as jest.Mock).mockImplementationOnce(() => {
        return {
          rows: [{
            id: 1,
            user_id: 1,
            token: 'valid-reset-token',
            expires_at: new Date(Date.now() + 3600000) // 1 hour in future
          }],
          rowCount: 1
        };
      });
      
      await verifyResetToken(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ valid: true });
    });
    
    it('should return 400 for invalid or expired token', async () => {
      // Setup request with invalid token
      mockRequest = {
        params: {
          token: 'invalid-reset-token'
        }
      };
      
      // Mock the database query for invalid token
      (pool.query as jest.Mock).mockImplementationOnce(() => {
        return { rows: [], rowCount: 0 };
      });
      
      await verifyResetToken(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid or expired token' })
      );
    });
    
    it('should return 400 if token is missing', async () => {
      // Setup request with missing token
      mockRequest = {
        params: {} // No token
      };
      
      await verifyResetToken(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Token is required' })
      );
    });
  });
  
  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      // Setup request with valid token
      mockRequest = {
        params: {
          token: 'valid-verification-token'
        }
      };
      
      // Mock the database query for valid token
      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('SELECT * FROM verification_tokens')) {
          return {
            rows: [{
              id: 1,
              user_id: 1,
              token: 'valid-verification-token',
              expires_at: new Date(Date.now() + 3600000) // 1 hour in future
            }],
            rowCount: 1
          };
        }
        
        if (query.includes('UPDATE users SET is_verified')) {
          return { rows: [], rowCount: 1 };
        }
        
        if (query.includes('DELETE FROM verification_tokens')) {
          return { rows: [], rowCount: 1 };
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      await verifyEmail(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Email verified successfully' })
      );
      
      // Verify database operations
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET is_verified'),
        expect.arrayContaining([1])
      );
      
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM verification_tokens'),
        expect.arrayContaining([1])
      );
    });
    
    it('should return 400 for invalid verification token', async () => {
      // Setup request with invalid token
      mockRequest = {
        params: {
          token: 'invalid-verification-token'
        }
      };
      
      // Mock the database query for invalid token
      (pool.query as jest.Mock).mockImplementationOnce(() => {
        return { rows: [], rowCount: 0 };
      });
      
      await verifyEmail(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid or expired verification token' })
      );
    });
    
    it('should return 400 if token is missing', async () => {
      // Setup request with missing token
      mockRequest = {
        params: {} // No token
      };
      
      await verifyEmail(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Verification token is required' })
      );
    });
  });
  
  describe('resendVerificationEmail', () => {
    it('should resend verification email for unverified user', async () => {
      // Setup request with email
      mockRequest = {
        body: {
          email: 'unverified@example.com'
        }
      };
      
      // Mock the database query for unverified user
      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('SELECT * FROM users WHERE email')) {
          return {
            rows: [{
              id: 1,
              email: 'unverified@example.com',
              username: 'unverified',
              name: 'Unverified User',
              is_verified: false
            }],
            rowCount: 1
          };
        }
        
        if (query.includes('DELETE FROM verification_tokens')) {
          return { rows: [], rowCount: 1 };
        }
        
        if (query.includes('INSERT INTO verification_tokens')) {
          return { rows: [], rowCount: 1 };
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      await resendVerificationEmail(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify email was sent
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'unverified@example.com',
        'Unverified User',
        expect.any(String)
      );
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Verification email sent successfully' })
      );
    });
    
    it('should return 400 if user is already verified', async () => {
      // Setup request with email of verified user
      mockRequest = {
        body: {
          email: 'verified@example.com'
        }
      };
      
      // Mock the database query for verified user
      (pool.query as jest.Mock).mockImplementationOnce(() => {
        return {
          rows: [{
            id: 1,
            email: 'verified@example.com',
            username: 'verified',
            name: 'Verified User',
            is_verified: true
          }],
          rowCount: 1
        };
      });
      
      await resendVerificationEmail(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Email is already verified' })
      );
      
      // Verify no email was sent
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
    
    it('should return 404 if user is not found', async () => {
      // Setup request with non-existent email
      mockRequest = {
        body: {
          email: 'nonexistent@example.com'
        }
      };
      
      // Mock the database query for non-existent user
      (pool.query as jest.Mock).mockImplementationOnce(() => {
        return { rows: [], rowCount: 0 };
      });
      
      await resendVerificationEmail(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'User not found' })
      );
      
      // Verify no email was sent
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
    
    it('should return 400 if email is not provided', async () => {
      // Setup request with missing email
      mockRequest = {
        body: {} // No email
      };
      
      await resendVerificationEmail(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Email is required' })
      );
    });
  });
  
  describe('login with extra edge cases', () => {
    beforeEach(() => {
      // Setup request with valid login data
      mockRequest = {
        body: {
          login: 'testuser',
          password: 'Password123',
          rememberMe: false
        },
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'test-agent'
        }
      };
      
      // Default mock for database queries
      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('SELECT * FROM users WHERE')) {
          return {
            rows: [{
              id: 1,
              email: 'test@example.com',
              username: 'testuser',
              password: 'hashedPassword',
              is_verified: true,
              failed_login_attempts: 0,
              is_locked: false
            }],
            rowCount: 1
          };
        }
        
        return { rows: [], rowCount: 0 };
      });
    });
    
    it('should fail login with incorrect password', async () => {
      // Modify request to use wrong password
      mockRequest = {
        ...mockRequest,
        body: {
          ...mockRequest.body,
          password: 'wrongpassword'
        }
      };
      
      await login(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid credentials' })
      );
      
      // Verify no token was generated
      expect(generateToken).not.toHaveBeenCalled();
    });
    
    it('should handle missing login identifier', async () => {
      // Setup request with missing login info
      mockRequest = {
        body: {
          password: 'Password123'
        }
      };
      
      await login(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Please provide email/username and password' })
      );
    });
    
    it('should handle user not found case', async () => {
      // Mock database query for non-existent user
      (pool.query as jest.Mock).mockImplementationOnce(() => {
        return { rows: [], rowCount: 0 };
      });
      
      await login(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid credentials' })
      );
    });
  });
  
  describe('OAuth callbacks', () => {
    it('should handle successful Google OAuth callback', () => {
      // Setup request with user
      mockRequest = {
        user: {
          id: 1,
          email: 'test@example.com',
          username: 'testuser'
        }
      };
      
      // Mock environment variable
      process.env.CLIENT_URL = 'http://localhost:3000';
      
      googleCallback(mockRequest as Request, mockResponse as Response);
      
      // Verify token was generated
      expect(generateToken).toHaveBeenCalledWith(mockRequest.user);
      
      // Verify redirect
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/success?token=mock-jwt-token'
      );
    });
    
    it('should handle failed Google OAuth callback', () => {
      // Setup request without user
      mockRequest = {};
      
      // Mock environment variable
      process.env.CLIENT_URL = 'http://localhost:3000';
      
      googleCallback(mockRequest as Request, mockResponse as Response);
      
      // Verify redirect to error page
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/error'
      );
    });
    
    it('should handle successful Facebook OAuth callback', () => {
      // Setup request with user
      mockRequest = {
        user: {
          id: 1,
          email: 'test@example.com',
          username: 'testuser'
        }
      };
      
      // Mock environment variable
      process.env.CLIENT_URL = 'http://localhost:3000';
      
      facebookCallback(mockRequest as Request, mockResponse as Response);
      
      // Verify token was generated
      expect(generateToken).toHaveBeenCalledWith(mockRequest.user);
      
      // Verify redirect
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/success?token=mock-jwt-token'
      );
    });
  });
  
  describe('checkVerificationStatus', () => {
    it('should return verification status for authenticated user', async () => {
      // Setup request with user
      mockRequest = {
        user: {
          id: 1,
          email: 'test@example.com',
          username: 'testuser'
        }
      };
      
      // Mock database query for verified user
      (pool.query as jest.Mock).mockImplementationOnce(() => {
        return {
          rows: [{
            is_verified: true
          }],
          rowCount: 1
        };
      });
      
      await checkVerificationStatus(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ isVerified: true });
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Setup request without user
      mockRequest = {};
      
      await checkVerificationStatus(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'User not authenticated' })
      );
    });
    
    it('should return 404 if user is not found in database', async () => {
      // Setup request with user
      mockRequest = {
        user: {
          id: 999, // Non-existent ID
          email: 'test@example.com',
          username: 'testuser'
        }
      };
      
      // Mock database query for non-existent user
      (pool.query as jest.Mock).mockImplementationOnce(() => {
        return { rows: [], rowCount: 0 };
      });
      
      await checkVerificationStatus(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'User not found' })
      );
    });
  });
}); 