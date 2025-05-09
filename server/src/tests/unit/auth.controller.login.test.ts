import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../../config/db';
import { login } from '../../controllers/auth.controller';
import { testControllerWrapper } from '../../utils/testWrappers';
import * as jwtUtils from '../../utils/jwt';

// Mock the database module
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn()
}));

// Mock the JWT utilities
jest.mock('../../utils/jwt', () => ({
  generateToken: jest.fn(() => 'mocked_token'),
  verifyToken: jest.fn()
}));

describe('Login Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let wrappedLogin: any;

  beforeEach(() => {
    mockRequest = {
      body: {
        login: 'test@example.com',
        password: 'password123',
      },
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
    
    wrappedLogin = testControllerWrapper(login);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should return 401 if user is not found', async () => {
    // Mock database query to return no user
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    // Call the controller
    await wrappedLogin(mockRequest as Request, mockResponse as Response);

    // Assertions
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringMatching(/SELECT \* FROM users WHERE email = \$1 OR username = \$1/),
      ['test@example.com']
    );
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Invalid credentials',
    }));
  });

  it('should return 401 if password is incorrect', async () => {
    // Mock database query to return a user
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          email: 'test@example.com',
          password: 'hashedPassword',
          username: 'testuser',
          is_verified: true,
        },
      ],
    });

    // Mock bcrypt compare to return false (password doesn't match)
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

    // Call the controller
    await wrappedLogin(mockRequest as Request, mockResponse as Response);

    // Assertions
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Invalid credentials',
    }));
  });

  it('should login successfully even if user is not verified', async () => {
    // Mock database query to return a user that is not verified
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          email: 'test@example.com',
          password: 'hashedPassword',
          username: 'testuser',
          is_verified: false,
        },
      ],
    });

    // Mock bcrypt compare to return true (password matches)
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

    // Call the controller
    await wrappedLogin(mockRequest as Request, mockResponse as Response);

    // The current implementation allows login for unverified users
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Login successful',
      token: expect.any(String)
    }));
  });

  it('should login successfully with correct credentials', async () => {
    // Mock database query to return a verified user
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          email: 'test@example.com',
          password: 'hashedPassword',
          username: 'testuser',
          is_verified: true,
        },
      ],
    });

    // Mock bcrypt compare to return true (password matches)
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

    // Call the controller
    await wrappedLogin(mockRequest as Request, mockResponse as Response);

    // Assertions
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Login successful',
      token: 'mocked_token'
    }));
  });
}); 