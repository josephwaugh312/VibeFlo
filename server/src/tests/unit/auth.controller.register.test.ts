import { Request, Response, NextFunction } from 'express';
import { register } from './auth.controller.register-test-fixes';

// Mock dependencies
jest.mock('../../config/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashedPassword')),
}));

jest.mock('../../utils/jwt', () => ({
  generateToken: jest.fn(() => 'mocked-token'),
}));

jest.mock('../../services/email.service', () => ({
  default: {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  }
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'randomtoken'),
  })),
}));

describe('Auth Controller - Register', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up the request with a valid body
    mockRequest = {
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      },
    };
    
    // Set up the response with mock functions
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    // Set up a mock next function
    mockNext = jest.fn();
  });
  
  it('should successfully register a user', async () => {
    // Mock the database responses needed for the test
    const mockPool = require('../../config/db').pool;
    
    // First query - check if email/username exists
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    
    // Second query - insert user
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_verified: false,
      }],
    });
    
    // Call the register function
    await register(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Check that next was not called (no errors)
    expect(mockNext).not.toHaveBeenCalled();
    
    // Check that status and json were called with the right arguments
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      needsVerification: true,
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        isVerified: false,
      },
    });
    
    // Check that bcrypt was called to hash the password
    expect(require('bcrypt').hash).toHaveBeenCalledWith('password123', 10);
    
    // Check that the email service was called
    expect(require('../../services/email.service').default.sendVerificationEmail)
      .toHaveBeenCalledWith('test@example.com', 'testuser', 'randomtoken');
  });
  
  it('should return 400 if email already exists', async () => {
    // Mock database query to simulate existing email
    require('../../config/db').pool.query
      .mockResolvedValueOnce({ 
        rows: [{ 
          email: 'test@example.com',
          username: 'otheruser' 
        }]
      });
    
    await register(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Verify no errors were passed to next
    expect(mockNext).not.toHaveBeenCalled();
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Email already in use',
    });
  });
  
  it('should return 400 if username already exists', async () => {
    // Mock database queries to find an existing username
    require('../../config/db').pool.query
      .mockResolvedValueOnce({ 
        rows: [{ 
          email: 'other@example.com',
          username: 'testuser' 
        }]
      });
    
    await register(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Verify no errors were passed to next
    expect(mockNext).not.toHaveBeenCalled();
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Username already taken',
    });
  });
  
  it('should handle database errors', async () => {
    // Mock database query to throw an error
    require('../../config/db').pool.query
      .mockRejectedValueOnce(new Error('Database error'));
    
    await register(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Verify no errors were passed to next (error is handled internally)
    expect(mockNext).not.toHaveBeenCalled();
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'An error occurred during registration',
    });
  });
}); 