const bcrypt = require('bcrypt');
const { login } = require('../../controllers/auth.controller.login.simple');

// Mock the database pool
jest.mock('../../config/db', () => ({
  query: jest.fn(),
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

// Mock JWT utilities
jest.mock('../../utils/jwt', () => ({
  generateToken: jest.fn(() => 'mock-token'),
}));

// Mock console to suppress error logs during tests
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'log').mockImplementation(() => {});

describe('Login Controller', () => {
  let mockRequest;
  let mockResponse;
  let mockPool;
  let mockCompare;
  
  beforeEach(() => {
    // Setup request mock
    mockRequest = {
      body: {
        login: 'test@example.com',
        password: 'password123',
      },
      app: {
        locals: {
          db: {
            pool: require('../../config/db')
          }
        }
      }
    };
    
    // Setup response mock
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn().mockReturnThis(),
    };
    
    // Get the mocked modules
    mockPool = require('../../config/db');
    mockCompare = require('bcrypt').compare;
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  it('should return 401 if user is not found', async () => {
    // Setup mock: No user found
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    
    // Call the controller
    await login(mockRequest, mockResponse);
    
    // Assertions
    expect(mockPool.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      ['test@example.com']
    );
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Invalid credentials'
    });
  });
  
  it('should return 401 if password is incorrect', async () => {
    // Setup mocks
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedPassword',
      }],
    });
    
    // Mock bcrypt to return false (password doesn't match)
    mockCompare.mockResolvedValueOnce(false);
    
    // Call the controller
    await login(mockRequest, mockResponse);
    
    // Assertions
    expect(mockCompare).toHaveBeenCalledWith('password123', 'hashedPassword');
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Invalid credentials'
    });
  });
  
  it('should login successfully with correct credentials', async () => {
    // Setup mocks
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
      password: 'hashedPassword',
      is_verified: true,
    };
    
    mockPool.query.mockResolvedValueOnce({
      rows: [mockUser],
    });
    
    // Mock bcrypt to return true (password matches)
    mockCompare.mockResolvedValueOnce(true);
    
    // Call the controller
    await login(mockRequest, mockResponse);
    
    // Assertions
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Login successful',
      token: 'mock-token',
      user: expect.objectContaining({
        id: 1,
        email: 'test@example.com',
        username: 'testuser'
      })
    }));
    
    // Check cookie was set with the right parameters
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'token',
      'mock-token',
      expect.objectContaining({
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      })
    );
  });
  
  it('should handle remember me option', async () => {
    // Update request to include rememberMe
    mockRequest.body.rememberMe = true;
    
    // Setup mocks
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedPassword',
        is_verified: true,
      }],
    });
    
    // Mock bcrypt to return true (password matches)
    mockCompare.mockResolvedValueOnce(true);
    
    // Call the controller
    await login(mockRequest, mockResponse);
    
    // Assertions for status and response
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Login successful',
      token: 'mock-token'
    }));
    
    // Verify cookie with longer expiration
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'token',
      'mock-token',
      expect.objectContaining({
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      })
    );
  });
  
  it('should return 400 if login/email and password are missing', async () => {
    // Setup request with missing credentials
    mockRequest.body = {};
    
    // Call the controller
    await login(mockRequest, mockResponse);
    
    // Assertions
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Please provide email/username and password'
    });
  });
}); 