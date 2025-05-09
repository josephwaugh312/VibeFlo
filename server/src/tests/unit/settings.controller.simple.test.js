const { getUserSettings, updateUserSettings } = require('../../controllers/settings.controller.simple');

// Mock the database pool
const mockPool = {
  query: jest.fn()
};

// Mock the database for tests
jest.mock('../../config/db', () => mockPool);

// Mock console.error to prevent noise in test output
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Settings Controller', () => {
  let mockRequest;
  let mockResponse;
  
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
      },
      app: {
        locals: {
          db: {
            pool: mockPool
          }
        }
      }
    };
  });
  
  describe('getUserSettings', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Setup request without user
      mockRequest.user = undefined;
      
      // Execute controller
      await getUserSettings(mockRequest, mockResponse);
      
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
      
      mockPool.query.mockResolvedValueOnce({
        rows: [mockSettings],
        rowCount: 1
      });
      
      // Execute controller
      await getUserSettings(mockRequest, mockResponse);
      
      // Verify database was queried with correct params
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM user_settings WHERE user_id = $1',
        [1]
      );
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockSettings);
    });
    
    it('should create default settings if user has no settings', async () => {
      // Mock the database query to return no existing settings
      mockPool.query.mockResolvedValueOnce({
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
        pomodoros_until_long_break: 4,
        auto_start_breaks: false,
        auto_start_pomodoros: false,
        dark_mode: false,
        sound_enabled: true,
        notification_enabled: true
      };
      
      mockPool.query.mockResolvedValueOnce({
        rows: [mockNewSettings],
        rowCount: 1
      });
      
      // Execute controller
      await getUserSettings(mockRequest, mockResponse);
      
      // Verify first database query to check existing settings
      expect(mockPool.query).toHaveBeenNthCalledWith(1,
        'SELECT * FROM user_settings WHERE user_id = $1',
        [1]
      );
      
      // Verify second database query to insert default settings
      expect(mockPool.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('INSERT INTO user_settings'),
        expect.arrayContaining([1, 25, 5, 15, 4])
      );
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockNewSettings);
    });
    
    it('should handle database errors', async () => {
      // Mock the database query to throw an error
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));
      
      // Execute controller
      await getUserSettings(mockRequest, mockResponse);
      
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
      mockRequest.body = {
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
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Setup request without user
      mockRequest.user = undefined;
      
      // Execute controller
      await updateUserSettings(mockRequest, mockResponse);
      
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
      await updateUserSettings(mockRequest, mockResponse);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Pomodoro duration must be between 1 and 60 minutes' 
      });
      
      // Setup request with invalid pomodoro duration (too low)
      mockRequest.body = {
        pomodoro_duration: 0 // Under the min of 1
      };
      
      // Execute controller again
      await updateUserSettings(mockRequest, mockResponse);
      
      // Verify response again
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
      await updateUserSettings(mockRequest, mockResponse);
      
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
      await updateUserSettings(mockRequest, mockResponse);
      
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
      await updateUserSettings(mockRequest, mockResponse);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Number of pomodoros until long break must be between 1 and 10' 
      });
    });
    
    it('should create new settings if user has no settings', async () => {
      // Reset body to valid settings
      mockRequest.body = {
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
      
      // Mock the database query to return no existing settings
      mockPool.query.mockResolvedValueOnce({
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
      
      mockPool.query.mockResolvedValueOnce({
        rows: [mockNewSettings],
        rowCount: 1
      });
      
      // Execute controller
      await updateUserSettings(mockRequest, mockResponse);
      
      // Verify first database query to check existing settings
      expect(mockPool.query).toHaveBeenNthCalledWith(1,
        'SELECT * FROM user_settings WHERE user_id = $1',
        [1]
      );
      
      // Verify second database query to insert new settings
      expect(mockPool.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('INSERT INTO user_settings'),
        expect.arrayContaining([
          1, 30, 10, 20, 3, false, true, true, true, false
        ])
      );
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockNewSettings);
    });
    
    it('should update existing settings if user has settings', async () => {
      // Reset body to valid settings
      mockRequest.body = {
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
      
      // Mock the database query to return existing settings
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          user_id: 1,
          pomodoro_duration: 25,
          short_break_duration: 5,
          long_break_duration: 15,
          pomodoros_until_long_break: 4,
          auto_start_breaks: true,
          auto_start_pomodoros: false,
          dark_mode: false,
          sound_enabled: true,
          notification_enabled: true
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
      
      mockPool.query.mockResolvedValueOnce({
        rows: [mockUpdatedSettings],
        rowCount: 1
      });
      
      // Execute controller
      await updateUserSettings(mockRequest, mockResponse);
      
      // Verify that mockPool.query was called at least twice
      expect(mockPool.query).toHaveBeenCalledTimes(2);
      
      // Verify first database query to check existing settings
      expect(mockPool.query).toHaveBeenNthCalledWith(1,
        'SELECT * FROM user_settings WHERE user_id = $1',
        [1]
      );
      
      // Verify that the second query starts with the right string
      const secondQuery = mockPool.query.mock.calls[1][0];
      expect(secondQuery).toContain('UPDATE user_settings');
      
      // Verify that the second query's parameters include all the expected values
      const secondQueryParams = mockPool.query.mock.calls[1][1];
      expect(secondQueryParams).toContain(1); // userId
      expect(secondQueryParams).toContain(30); // pomodoro_duration
      expect(secondQueryParams).toContain(10); // short_break_duration
      expect(secondQueryParams).toContain(20); // long_break_duration
      expect(secondQueryParams).toContain(3);  // pomodoros_until_long_break
      expect(secondQueryParams).toContain(false); // auto_start_breaks
      expect(secondQueryParams).toContain(true);  // auto_start_pomodoros
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockUpdatedSettings);
    });
    
    it('should handle database errors', async () => {
      // Mock the database query to throw an error
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));
      
      // Execute controller
      await updateUserSettings(mockRequest, mockResponse);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalled();
    });
  });
}); 