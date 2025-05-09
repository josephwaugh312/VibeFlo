import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
const { login } = require('../../controllers/auth.controller.simple');

// Mock database
jest.mock('../../config/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

// Mock bcrypt
jest.mock('bcrypt');

// Mock the jwt utility - use a different approach since we're mocking a module used by the controller
jest.mock('../../utils/jwt', () => ({
  generateToken: jest.fn(() => 'mocked_token')
}));

describe('Login Controller (Simple)', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockPool: any;

  beforeEach(() => {
    // Create mock request with properly typed app property
    mockRequest = {
      body: {
        email: 'test@example.com',
        password: 'password123',
      }
    } as Partial<Request>;

    // Add app.locals.db manually to avoid TypeScript errors
    (mockRequest as any).app = {
      locals: {
        db: {
          pool: {
            query: jest.fn(),
          },
        },
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
    
    mockPool = (mockRequest as any).app.locals.db.pool;

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should return 401 if user is not found', async () => {
    // Mock database query to return no user
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    // Call the controller
    await login(mockRequest as Request, mockResponse as Response);

    // Assertions
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringMatching(/SELECT \* FROM users WHERE email = \$1 OR username = \$1/),
      ['test@example.com']
    );
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid credentials',
    });
  });

  it('should return 401 if password is incorrect', async () => {
    // Mock database query to return a user
    mockPool.query.mockResolvedValueOnce({
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
    await login(mockRequest as Request, mockResponse as Response);

    // Assertions
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid credentials',
    });
  });

  it('should return 403 if user is not verified', async () => {
    // Mock database query to return a user that is not verified
    mockPool.query.mockResolvedValueOnce({
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
    await login(mockRequest as Request, mockResponse as Response);

    // Assertions
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Please verify your email before logging in',
      verificationRequired: true
    });
  });

  it('should login successfully with correct credentials', async () => {
    // Mock database query to return a verified user
    mockPool.query.mockResolvedValueOnce({
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
    await login(mockRequest as Request, mockResponse as Response);

    // Assertions
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'jwt',
      'mocked_token',
      expect.objectContaining({
        httpOnly: true,
        secure: expect.any(Boolean),
        maxAge: expect.any(Number),
      })
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      userId: 1,
      username: 'testuser',
    });
  });
});