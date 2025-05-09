import { Request, Response, NextFunction } from 'express';
import { getUserSettings, updateUserSettings } from '../../controllers/settings.controller';
import pool from '../../config/db';

// Mock the database pool
jest.mock('../../config/db', () => ({
  query: jest.fn(),
  connect: jest.fn().mockReturnValue({
    query: jest.fn(),
    release: jest.fn()
  })
}));

describe('Settings Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Create mock next function
    mockNext = jest.fn();
    
    // Suppress console logs and errors for cleaner test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('getUserSettings', () => {
    it('should return user settings when they exist', async () => {
      // Setup request with authenticated user
      mockRequest = {
        user: { id: 1 }
      };
      
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('information_schema.tables')) {
          return { rows: [{ exists: true }] };
        }
        
        if (query.includes('SELECT * FROM user_settings')) {
          return { 
            rows: [{
              id: 1,
              user_id: 1,
              pomodoro_duration: 30,
              short_break_duration: 8,
              long_break_duration: 20,
              pomodoros_until_long_break: 3,
              auto_start_breaks: true,
              auto_start_pomodoros: false,
              dark_mode: true,
              sound_enabled: true,
              notification_enabled: false
            }],
            rowCount: 1
          };
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      // Call the controller function
      await getUserSettings(mockRequest as Request, mockResponse as Response);
      
      // Verify table existence was checked
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('information_schema.tables'));
      
      // Verify settings were fetched for the user
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM user_settings'),
        [1]
      );
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        pomodoro_duration: 30,
        short_break_duration: 8,
        long_break_duration: 20,
        pomodoros_until_long_break: 3,
        auto_start_breaks: true,
        auto_start_pomodoros: false,
        dark_mode: true,
        sound_enabled: true,
        notification_enabled: false
      }));
    });

    it('should return default settings when user has no settings', async () => {
      // Setup request with authenticated user
      mockRequest = {
        user: { id: 1 }
      };
      
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('information_schema.tables')) {
          return { rows: [{ exists: true }] };
        }
        
        if (query.includes('SELECT * FROM user_settings')) {
          return { rows: [], rowCount: 0 };
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      // Call the controller function
      await getUserSettings(mockRequest as Request, mockResponse as Response);
      
      // Verify response contains default settings
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        pomodoro_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        pomodoros_until_long_break: 4,
        auto_start_breaks: false,
        auto_start_pomodoros: false,
        dark_mode: false,
        sound_enabled: true,
        notification_enabled: true
      }));
    });

    it('should return default settings when user_settings table does not exist', async () => {
      // Setup request with authenticated user
      mockRequest = {
        user: { id: 1 }
      };
      
      // Mock database response for non-existent table
      (pool.query as jest.Mock).mockImplementationOnce(() => {
        return { rows: [{ exists: false }] };
      });
      
      // Call the controller function
      await getUserSettings(mockRequest as Request, mockResponse as Response);
      
      // Verify response contains default settings
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        pomodoro_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        pomodoros_until_long_break: 4,
        auto_start_breaks: false,
        auto_start_pomodoros: false,
        dark_mode: false,
        sound_enabled: true,
        notification_enabled: true
      }));
    });

    it('should return 401 when user is not authenticated', async () => {
      // Setup request without user (unauthenticated)
      mockRequest = {};
      
      // Call the controller function
      await getUserSettings(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should return default settings on database error', async () => {
      // Setup request with authenticated user
      mockRequest = {
        user: { id: 1 }
      };
      
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('information_schema.tables')) {
          return { rows: [{ exists: true }] };
        }
        
        if (query.includes('SELECT * FROM user_settings')) {
          throw new Error('Database error');
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      // Call the controller function
      await getUserSettings(mockRequest as Request, mockResponse as Response);
      
      // Verify response contains default settings
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        pomodoro_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        pomodoros_until_long_break: 4
      }));
    });
    
    it('should return 500 on unexpected error', async () => {
      // Setup request with authenticated user
      mockRequest = {
        user: { id: 1 }
      };
      
      // Mock database to throw unexpected error
      (pool.query as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });
      
      // Call the controller function
      await getUserSettings(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('updateUserSettings', () => {
    beforeEach(() => {
      // Setup request with authenticated user and settings to update
      mockRequest = {
        user: { id: 1 },
        body: {
          pomodoro_duration: 35,
          short_break_duration: 10,
          long_break_duration: 25,
          pomodoros_until_long_break: 5,
          auto_start_breaks: true,
          auto_start_pomodoros: true,
          dark_mode: true,
          sound_enabled: false,
          notification_enabled: true
        }
      };
    });

    it('should update and return settings when they exist', async () => {
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('information_schema.tables')) {
          return { rows: [{ exists: true }] };
        }
        
        if (query.includes('SELECT * FROM user_settings')) {
          return { 
            rows: [{
              id: 1,
              user_id: 1,
              pomodoro_duration: 30,
              short_break_duration: 8,
              long_break_duration: 20,
              pomodoros_until_long_break: 3,
              auto_start_breaks: false,
              auto_start_pomodoros: false,
              dark_mode: false,
              sound_enabled: true,
              notification_enabled: false
            }],
            rowCount: 1
          };
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      // Call the controller function
      await updateUserSettings(mockRequest as Request, mockResponse as Response);
      
      // Verify response contains updated settings
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        pomodoro_duration: 35,
        short_break_duration: 10,
        long_break_duration: 25,
        pomodoros_until_long_break: 5,
        auto_start_breaks: true,
        auto_start_pomodoros: true,
        dark_mode: true,
        sound_enabled: false,
        notification_enabled: true
      }));
    });

    it('should return new settings when user has no existing settings', async () => {
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('information_schema.tables')) {
          return { rows: [{ exists: true }] };
        }
        
        if (query.includes('SELECT * FROM user_settings')) {
          return { rows: [], rowCount: 0 };
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      // Call the controller function
      await updateUserSettings(mockRequest as Request, mockResponse as Response);
      
      // Verify response contains requested settings
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        pomodoro_duration: 35,
        short_break_duration: 10,
        long_break_duration: 25,
        pomodoros_until_long_break: 5,
        auto_start_breaks: true,
        auto_start_pomodoros: true,
        dark_mode: true,
        sound_enabled: false,
        notification_enabled: true
      }));
    });

    it('should return provided settings when user_settings table does not exist', async () => {
      // Mock database response for non-existent table
      (pool.query as jest.Mock).mockImplementationOnce(() => {
        return { rows: [{ exists: false }] };
      });
      
      // Call the controller function
      await updateUserSettings(mockRequest as Request, mockResponse as Response);
      
      // Verify response contains requested settings
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        pomodoro_duration: 35,
        short_break_duration: 10,
        long_break_duration: 25,
        pomodoros_until_long_break: 5,
        auto_start_breaks: true,
        auto_start_pomodoros: true,
        dark_mode: true,
        sound_enabled: false,
        notification_enabled: true
      }));
    });

    it('should return 401 when user is not authenticated', async () => {
      // Setup request without user (unauthenticated)
      mockRequest = {
        body: {
          pomodoro_duration: 35
        }
      };
      
      // Call the controller function
      await updateUserSettings(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should handle partial updates correctly', async () => {
      // Setup request with only some settings to update
      mockRequest = {
        user: { id: 1 },
        body: {
          pomodoro_duration: 40,
          dark_mode: true
        }
      };
      
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('information_schema.tables')) {
          return { rows: [{ exists: true }] };
        }
        
        if (query.includes('SELECT * FROM user_settings')) {
          return { 
            rows: [{
              id: 1,
              user_id: 1,
              pomodoro_duration: 30,
              short_break_duration: 8,
              long_break_duration: 20,
              pomodoros_until_long_break: 3,
              auto_start_breaks: false,
              auto_start_pomodoros: false,
              dark_mode: false,
              sound_enabled: true,
              notification_enabled: true
            }],
            rowCount: 1
          };
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      // Call the controller function
      await updateUserSettings(mockRequest as Request, mockResponse as Response);
      
      // Verify response contains updated fields and preserves others
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        pomodoro_duration: 40, // Updated
        short_break_duration: 8, // Preserved
        long_break_duration: 20, // Preserved
        pomodoros_until_long_break: 3, // Preserved
        auto_start_breaks: false, // Preserved
        auto_start_pomodoros: false, // Preserved
        dark_mode: true, // Updated
        sound_enabled: true, // Preserved
        notification_enabled: true // Preserved
      }));
    });

    it('should handle database errors gracefully', async () => {
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('information_schema.tables')) {
          return { rows: [{ exists: true }] };
        }
        
        if (query.includes('SELECT * FROM user_settings')) {
          throw new Error('Database error');
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      // Call the controller function
      await updateUserSettings(mockRequest as Request, mockResponse as Response);
      
      // Verify response contains requested settings despite database error
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        pomodoro_duration: 35,
        short_break_duration: 10,
        long_break_duration: 25,
        pomodoros_until_long_break: 5
      }));
    });
    
    it('should return 500 on unexpected error', async () => {
      // Mock database to throw unexpected error
      (pool.query as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });
      
      // Call the controller function
      await updateUserSettings(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
}); 