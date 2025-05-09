import { Request, Response, NextFunction } from 'express';
import { getAllThemes, getThemeById, getPublicCustomThemes, getUserCustomThemes } from '../../controllers/theme.controller';
import { testThemeControllerWrapper, createMockResponse, createMockNext } from '../../utils/testWrappers';
import pool from '../../config/db';

// Mock the database pool
jest.mock('../../config/db', () => {
  return {
    query: jest.fn()
  };
});

describe('Theme Controller With Wrapper', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock response with spy functions
    mockResponse = createMockResponse();
    
    // Default mock request
    mockRequest = {};
    
    // Create mock next function
    mockNext = createMockNext();
    
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
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockThemes,
        rowCount: mockThemes.length
      });
      
      // Call the controller with the wrapper
      await testThemeControllerWrapper(getAllThemes, mockRequest, mockResponse, mockNext);
      
      // Verify database was queried
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM themes ORDER BY is_default DESC, name ASC'
      );
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockThemes);
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      const mockError = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(mockError);
      
      // Call the controller with the wrapper
      await testThemeControllerWrapper(getAllThemes, mockRequest, mockResponse, mockNext);
      
      // The error is now being handled by returning a 500 status instead of calling next
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
    });
  });
  
  describe('getThemeById', () => {
    beforeEach(() => {
      mockRequest = {
        params: {
          id: '1'
        }
      };
    });
    
    it('should return a theme by ID', async () => {
      // Mock database response
      const mockTheme = { id: 1, name: 'Light', is_default: true, colors: { primary: '#ffffff' } };
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockTheme],
        rowCount: 1
      });
      
      // Call the controller with the wrapper
      await testThemeControllerWrapper(getThemeById, mockRequest, mockResponse, mockNext);
      
      // Verify database was queried
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM themes WHERE id = $1',
        ['1']
      );
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockTheme);
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should return 404 if theme not found', async () => {
      // Mock empty database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });
      
      // Call the controller with the wrapper
      await testThemeControllerWrapper(getThemeById, mockRequest, mockResponse, mockNext);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Theme not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      const mockError = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(mockError);
      
      // Call the controller with the wrapper
      await testThemeControllerWrapper(getThemeById, mockRequest, mockResponse, mockNext);
      
      // The error is now being handled by returning a 500 status instead of calling next
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
    });
  });
  
  describe('getPublicCustomThemes', () => {
    it('should return all public custom themes', async () => {
      // Mock database response
      const mockThemes = [
        { id: 1, name: 'Custom Theme 1', is_public: true, creator: 'Test User' },
        { id: 2, name: 'Custom Theme 2', is_public: true, creator: 'Another User' }
      ];
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockThemes,
        rowCount: mockThemes.length
      });
      
      // Call the controller with the wrapper
      await testThemeControllerWrapper(getPublicCustomThemes, mockRequest, mockResponse, mockNext);
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockThemes);
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      const mockError = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(mockError);
      
      // Call the controller with the wrapper
      await testThemeControllerWrapper(getPublicCustomThemes, mockRequest, mockResponse, mockNext);
      
      // The error is now being handled by returning a 500 status instead of calling next
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
    });
  });
  
  describe('getUserCustomThemes', () => {
    it('should return 401 if user not authenticated', async () => {
      // Setup unauthenticated request
      const unauthRequest = { user: null };
      
      // Call the controller with the wrapper
      await testThemeControllerWrapper(getUserCustomThemes, unauthRequest, mockResponse, mockNext);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should return user custom themes', async () => {
      // Setup authenticated request
      const authRequest = {
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
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockThemes,
        rowCount: mockThemes.length
      });
      
      // Call the controller with the wrapper
      await testThemeControllerWrapper(getUserCustomThemes, authRequest, mockResponse, mockNext);
      
      // Verify database was queried
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM custom_themes WHERE user_id = $1 ORDER BY created_at DESC',
        [1]
      );
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockThemes);
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should handle database errors', async () => {
      // Setup authenticated request
      const authRequest = {
        user: {
          id: 1,
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com'
        }
      };
      
      // Mock database error
      const mockError = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(mockError);
      
      // Call the controller with the wrapper
      await testThemeControllerWrapper(getUserCustomThemes, authRequest, mockResponse, mockNext);
      
      // The error is now being handled by returning a 500 status instead of calling next
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
    });
  });
}); 