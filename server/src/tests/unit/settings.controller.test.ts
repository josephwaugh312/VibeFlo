import { Request, Response } from 'express';
import { getUserSettings, updateUserSettings } from './settings.controller-test-fixes';
import pool from '../../config/db';

// Mock the database pool
jest.mock('../../config/db', () => {
  return {
    query: jest.fn()
  };
});

// Mock console.error to prevent test output noise
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Settings Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup mock response with spy functions
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Setup mock request with authenticated user
    mockRequest = {
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser'
      }
    };
  });
  
  describe('getUserSettings', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Setup request without user
      mockRequest = {};
      
      // Execute controller
      await getUserSettings(mockRequest as any, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });
    
    it('should return existing settings if user has settings', async () => {
      // Mock the database query to return existing settings
      const mockSettings = {
        id: 1,
        user_id: 1,
        pomodoro_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        pomodoros_until_long_break: 4,
        auto_start_breaks: true,
        auto_start_pomodoros: true,
        dark_mode: false,
        sound_enabled: true,
        notification_enabled: true
      };
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockSettings],
        rowCount: 1
      });
      
      // Execute controller
      await getUserSettings(mockRequest as any, mockResponse as Response);
      
      // Verify database was queried with correct params
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM user_settings WHERE user_id = $1',
        [1]
      );
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockSettings);
    });
    
    it('should create default settings if user has no settings', async () => {
      // Mock the database query to return no existing settings
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });
      
      // Mock the insert query
      const mockNewSettings = {
        id: 1,
        user_id: 1,
        pomodoro_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        pomodoros_until_long_break: 4
      };
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockNewSettings],
        rowCount: 1
      });
      
      // Execute controller
      await getUserSettings(mockRequest as any, mockResponse as Response);
      
      // Verify first database query to check existing settings
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM user_settings WHERE user_id = $1',
        [1]
      );
      
      // Verify second database query to insert default settings
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_settings'),
        [1]
      );
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockNewSettings);
    });
    
    it('should handle database errors', async () => {
      // Mock the database query to throw an error
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      // Execute controller
      await getUserSettings(mockRequest as any, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('updateUserSettings', () => {
    beforeEach(() => {
      // Setup mock request with valid settings data
      mockRequest = {
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          username: 'testuser'
        },
        body: {
          pomodoro_duration: 30,
          short_break_duration: 10,
          long_break_duration: 20,
          pomodoros_until_long_break: 3,
          auto_start_breaks: false,
          auto_start_pomodoros: true,
          dark_mode: true,
          sound_enabled: true,
          notification_enabled: false
        }
      };
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Setup request without user
      mockRequest = {
        body: {}
      };
      
      // Execute controller
      await updateUserSettings(mockRequest as any, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });
    
    it('should validate pomodoro_duration is within range', async () => {
      // Setup request with invalid pomodoro duration
      mockRequest.body = {
        pomodoro_duration: 65 // Over the max of 60
      };
      
      // Execute controller
      await updateUserSettings(mockRequest as any, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Pomodoro duration must be between 1 and 60 minutes' 
      });
      
      // Setup request with invalid pomodoro duration (too low)
      mockRequest.body = {
        pomodoro_duration: 0 // Under the min of 1
      };
      
      // Execute controller
      await updateUserSettings(mockRequest as any, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Pomodoro duration must be between 1 and 60 minutes' 
      });
    });
    
    it('should validate short_break_duration is within range', async () => {
      // Setup request with invalid short break duration
      mockRequest.body = {
        short_break_duration: 35 // Over the max of 30
      };
      
      // Execute controller
      await updateUserSettings(mockRequest as any, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Short break duration must be between 1 and 30 minutes' 
      });
    });
    
    it('should validate long_break_duration is within range', async () => {
      // Setup request with invalid long break duration
      mockRequest.body = {
        long_break_duration: 65 // Over the max of 60
      };
      
      // Execute controller
      await updateUserSettings(mockRequest as any, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Long break duration must be between 1 and 60 minutes' 
      });
    });
    
    it('should validate pomodoros_until_long_break is within range', async () => {
      // Setup request with invalid pomodoros until long break
      mockRequest.body = {
        pomodoros_until_long_break: 12 // Over the max of 10
      };
      
      // Execute controller
      await updateUserSettings(mockRequest as any, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Pomodoros until long break must be between 1 and 10' 
      });
    });
    
    it('should create new settings if user has no settings', async () => {
      // Mock the database query to return no existing settings
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });
      
      // Mock the insert query
      const mockNewSettings = {
        id: 1,
        user_id: 1,
        pomodoro_duration: 30,
        short_break_duration: 10,
        long_break_duration: 20,
        pomodoros_until_long_break: 3,
        auto_start_breaks: false,
        auto_start_pomodoros: true,
        dark_mode: true,
        sound_enabled: true,
        notification_enabled: false
      };
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockNewSettings],
        rowCount: 1
      });
      
      // Execute controller
      await updateUserSettings(mockRequest as any, mockResponse as Response);
      
      // Verify first database query to check existing settings
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM user_settings WHERE user_id = $1',
        [1]
      );
      
      // Verify second database query to insert new settings
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_settings'),
        expect.arrayContaining([1, 30, 10, 20, 3, false, true, true, true, false])
      );
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockNewSettings);
    });
    
    it('should update existing settings if user has settings', async () => {
      // Mock the database query to return existing settings
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 1,
          user_id: 1,
          pomodoro_duration: 25,
          short_break_duration: 5,
          long_break_duration: 15,
          pomodoros_until_long_break: 4
        }],
        rowCount: 1
      });
      
      // Mock the update query
      const mockUpdatedSettings = {
        id: 1,
        user_id: 1,
        pomodoro_duration: 30,
        short_break_duration: 10,
        long_break_duration: 20,
        pomodoros_until_long_break: 3,
        auto_start_breaks: false,
        auto_start_pomodoros: true,
        dark_mode: true,
        sound_enabled: true,
        notification_enabled: false,
        updated_at: new Date()
      };
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockUpdatedSettings],
        rowCount: 1
      });
      
      // Execute controller
      await updateUserSettings(mockRequest as any, mockResponse as Response);
      
      // Verify first database query to check existing settings
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM user_settings WHERE user_id = $1',
        [1]
      );
      
      // Verify second database query to update settings
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_settings SET'),
        expect.arrayContaining([1, 30, 10, 20, 3, false, true, true, true, false])
      );
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockUpdatedSettings);
    });
    
    it('should handle database errors', async () => {
      // Mock the database query to throw an error
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      // Execute controller
      await updateUserSettings(mockRequest as any, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalled();
    });
  });
}); 