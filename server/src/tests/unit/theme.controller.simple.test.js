const { 
  getAllThemes, 
  getThemeById, 
  getPublicCustomThemes, 
  getUserCustomThemes 
} = require('../../controllers/theme.controller.simple');

// Mock the database pool
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

// Import pool after mocking
const pool = require('../../config/db');

describe('Theme Controller', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock response with spy functions
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Default mock request
    mockRequest = {
      app: {
        locals: {
          db: pool
        }
      }
    };
    
    // Mock next function
    mockNext = jest.fn();
    
    // Mock console.error to prevent noise in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  describe('getAllThemes', () => {
    it('should return all themes', async () => {
      // Mock database response
      const mockThemes = [
        { id: 1, name: 'Light', is_default: true, colors: { primary: '#ffffff' } },
        { id: 2, name: 'Dark', is_default: false, colors: { primary: '#000000' } }
      ];
      
      pool.query.mockResolvedValueOnce({
        rows: mockThemes,
        rowCount: mockThemes.length
      });
      
      // Call the controller
      await getAllThemes(mockRequest, mockResponse, mockNext);
      
      // Verify database was queried
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM themes ORDER BY is_default DESC, name ASC'
      );
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockThemes);
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      pool.query.mockRejectedValueOnce(new Error('Database error'));
      
      // Call the controller
      await getAllThemes(mockRequest, mockResponse, mockNext);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
      
      // Verify console.error was called
      expect(console.error).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
  
  describe('getThemeById', () => {
    beforeEach(() => {
      mockRequest = {
        app: {
          locals: {
            db: pool
          }
        },
        params: {
          id: '1'
        }
      };
    });
    
    it('should return a theme by ID', async () => {
      // Mock database response
      const mockTheme = { id: 1, name: 'Light', is_default: true, colors: { primary: '#ffffff' } };
      
      pool.query.mockResolvedValueOnce({
        rows: [mockTheme],
        rowCount: 1
      });
      
      // Call the controller
      await getThemeById(mockRequest, mockResponse, mockNext);
      
      // Verify database was queried
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM themes WHERE id = $1',
        ['1']
      );
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockTheme);
    });
    
    it('should return 404 if theme not found', async () => {
      // Mock empty database response
      pool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });
      
      // Call the controller
      await getThemeById(mockRequest, mockResponse, mockNext);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Theme not found' });
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      pool.query.mockRejectedValueOnce(new Error('Database error'));
      
      // Call the controller
      await getThemeById(mockRequest, mockResponse, mockNext);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
  
  describe('getPublicCustomThemes', () => {
    it('should return all public custom themes', async () => {
      // Mock database response
      const mockThemes = [
        { id: 1, name: 'Custom Theme 1', is_public: true, creator: 'Test User' },
        { id: 2, name: 'Custom Theme 2', is_public: true, creator: 'Another User' }
      ];
      
      pool.query.mockResolvedValueOnce({
        rows: mockThemes,
        rowCount: mockThemes.length
      });
      
      // Call the controller
      await getPublicCustomThemes(mockRequest, mockResponse, mockNext);
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockThemes);
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      pool.query.mockRejectedValueOnce(new Error('Database error'));
      
      // Call the controller
      await getPublicCustomThemes(mockRequest, mockResponse, mockNext);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
  
  describe('getUserCustomThemes', () => {
    it('should return 401 if user not authenticated', async () => {
      // Setup unauthenticated request
      mockRequest = { 
        app: {
          locals: {
            db: pool
          }
        },
        user: null 
      };
      
      // Call the controller
      await getUserCustomThemes(mockRequest, mockResponse, mockNext);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });
    
    it('should return user custom themes', async () => {
      // Setup authenticated request
      mockRequest = {
        app: {
          locals: {
            db: pool
          }
        },
        user: {
          id: 1,
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com'
        }
      };
      
      // Mock database response
      const mockThemes = [
        { id: 1, name: 'My Theme 1', user_id: 1 },
        { id: 2, name: 'My Theme 2', user_id: 1 }
      ];
      
      pool.query.mockResolvedValueOnce({
        rows: mockThemes,
        rowCount: mockThemes.length
      });
      
      // Call the controller
      await getUserCustomThemes(mockRequest, mockResponse, mockNext);
      
      // Verify database was queried
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM custom_themes WHERE user_id = $1 ORDER BY created_at DESC',
        [1]
      );
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockThemes);
    });
    
    it('should handle database errors', async () => {
      // Setup authenticated request
      mockRequest = {
        app: {
          locals: {
            db: pool
          }
        },
        user: {
          id: 1,
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com'
        }
      };
      
      // Mock database error
      pool.query.mockRejectedValueOnce(new Error('Database error'));
      
      // Call the controller
      await getUserCustomThemes(mockRequest, mockResponse, mockNext);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
}); 