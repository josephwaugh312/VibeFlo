// Define the path to the module we want to mock
const dbModulePath = '../../config/db';

// Create our mock implementation with a working query function
const dbMock = {
  query: jest.fn()
};

// Mock the module
jest.mock(dbModulePath, () => dbMock);

// Now we can import our modules
const jwt = require('jsonwebtoken');
const { authenticate } = require('../../middleware/auth.simple.fixed');

describe('Auth Middleware Tests', () => {
  beforeEach(() => {
    // Clear all mocks between tests
    jest.clearAllMocks();
    jest.spyOn(jwt, 'verify');
  });
  
  test('should pass request when token is valid', async () => {
    // Arrange
    const mockRequest = {
      cookies: { token: 'valid.token' },
      headers: {}
    };
    const mockResponse = {};
    const mockNext = jest.fn();
    
    // Set up mock implementation for verify
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { id: 1 });
    });
    
    // Set up mock implementation for query
    dbMock.query.mockResolvedValue({
      rows: [{ id: 1, username: 'testuser' }]
    });
    
    // Act
    authenticate(mockRequest, mockResponse, mockNext);
    
    // Use setTimeout to wait for the async code to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Assert
    expect(jwt.verify).toHaveBeenCalledWith('valid.token', expect.any(String), expect.any(Function));
    expect(dbMock.query).toHaveBeenCalledWith(expect.any(String), [1]);
    expect(mockRequest.user).toEqual({ id: 1, username: 'testuser' });
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(); // no error
  });
  
  test('should return error if no token is provided', () => {
    // Arrange
    const mockRequest = {
      cookies: {},
      headers: {}
    };
    const mockResponse = {};
    const mockNext = jest.fn();
    
    // Act
    authenticate(mockRequest, mockResponse, mockNext);
    
    // Assert
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
      message: 'No auth token'
    }));
  });
}); 