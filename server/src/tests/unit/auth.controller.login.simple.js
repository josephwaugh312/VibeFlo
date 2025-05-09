/**
 * Simplified login controller test
 * Uses plain JavaScript to avoid TypeScript issues
 */

// Import the login from the auth controller simple implementation
const { login } = require('../../controllers/auth.controller.simple');

// Mock the required modules
jest.mock('../../config/db', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Create mock functions
const mockCompare = jest.fn();
jest.mock('bcrypt', () => ({
  compare: mockCompare
}));

jest.mock('../../utils/jwt', () => ({
  generateToken: jest.fn(() => 'mocked_token')
}));

describe('Login Controller (Simple JS)', () => {
  let mockRequest;
  let mockResponse;
  let mockPool;

  beforeEach(() => {
    // Create mock request
    mockRequest = {
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
      app: {
        locals: {
          db: {
            pool: {
              query: jest.fn(),
            }
          }
        }
      }
    };

    // Create mock response
    mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(() => mockResponse),
      cookie: jest.fn(() => mockResponse),
    };
    
    // Get the mock db pool from the app object
    mockPool = mockRequest.app.locals.db.pool;

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should return 401 if user is not found', async () => {
    // Mock database query to return no user
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    // Call the controller
    await login(mockRequest, mockResponse);

    // Assertions
    expect(mockPool.query).toHaveBeenCalled();
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
    mockCompare.mockResolvedValueOnce(false);

    // Call the controller
    await login(mockRequest, mockResponse);

    // Assertions
    expect(mockCompare).toHaveBeenCalledWith('password123', 'hashedPassword');
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
    mockCompare.mockResolvedValueOnce(true);

    // Call the controller
    await login(mockRequest, mockResponse);

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
    mockCompare.mockResolvedValueOnce(true);

    // Call the controller
    await login(mockRequest, mockResponse);

    // Assertions
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'jwt',
      'mocked_token',
      expect.objectContaining({
        httpOnly: true,
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