const { getUserTheme, setUserTheme } = require('../../controllers/theme.controller.simple');

// Mock the database pool
const mockPool = {
  query: jest.fn()
};

// Mock the database for tests
jest.mock('../../config/db', () => mockPool);

// Mock console.log and console.error to prevent noise in test output
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Theme Controller - User Theme Management', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up mock request with authenticated user
    mockRequest = {
      user: {
        id: 1,
        username: 'testuser'
      },
      body: {
        theme_id: '2'  // Default theme ID for tests
      },
      app: {
        locals: {
          db: {
            pool: mockPool
          }
        }
      }
    };
    
    // Set up mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Set up mock next function
    mockNext = jest.fn();
  });
  
  describe('setUserTheme', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Remove user from request
      mockRequest.user = null;
      
      // Call the controller
      await setUserTheme(mockRequest, mockResponse, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User not authenticated'
      });
    });
    
    it('should return 400 if theme_id is missing', async () => {
      // Remove theme_id from request
      mockRequest.body = {};
      
      // Call the controller
      await setUserTheme(mockRequest, mockResponse, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Theme ID is required'
      });
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));
      
      // Call the controller
      await setUserTheme(mockRequest, mockResponse, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });
  
  describe('getUserTheme', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Remove user from request
      mockRequest.user = null;
      
      // Call the controller
      await getUserTheme(mockRequest, mockResponse, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User not authenticated'
      });
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));
      
      // Call the controller
      await getUserTheme(mockRequest, mockResponse, mockNext);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });
}); 