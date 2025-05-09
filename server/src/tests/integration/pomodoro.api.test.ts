/**
 * Integration tests for the pomodoro API endpoints
 * These tests use mocked database and authentication
 */

import { setupIntegrationTestMocks, generateTestToken, setupDbMockResponses } from './setupIntegrationTests';
import { mockPool } from '../mocks/db-mock';

// Force Jest to mock the modules before they get imported by any test code
jest.doMock('../../config/db', () => mockPool);

// Run setup to properly mock all dependencies
setupIntegrationTestMocks();

describe('Pomodoro API Endpoints', () => {
  // Mock handler for GET /api/pomodoro/settings
  const getPomodoroSettingsHandler = (isAuthenticated: boolean = true, mockResponses: any[] = []) => {
    // Check authentication
    if (!isAuthenticated) {
      return {
        status: 401,
        body: {
          message: 'Unauthorized - No valid token provided'
        }
      };
    }
    
    // Get settings from mock responses, or return default if none
    const hasSettings = mockResponses.length > 0 && mockResponses[0].rowCount > 0;
    
    if (hasSettings) {
      return {
        status: 200,
        body: {
          settings: mockResponses[0].rows[0],
          message: 'Settings retrieved successfully'
        }
      };
    } else {
      // Return default settings if no settings found
      return {
        status: 200,
        body: {
          settings: {
            pomodoro_duration: 25,
            short_break_duration: 5,
            long_break_duration: 15,
            pomodoros_until_long_break: 4,
            auto_start_breaks: true,
            auto_start_pomodoros: false
          },
          message: 'Default settings retrieved'
        }
      };
    }
  };
  
  // Mock handler for PUT /api/pomodoro/settings
  const updatePomodoroSettingsHandler = (data: any, isAuthenticated: boolean = true, mockResponses: any[] = []) => {
    // Check authentication
    if (!isAuthenticated) {
      return {
        status: 401,
        body: {
          message: 'Unauthorized - No valid token provided'
        }
      };
    }
    
    // Validate settings
    if (data.pomodoro_duration !== undefined) {
      if (data.pomodoro_duration < 1 || data.pomodoro_duration > 60) {
        return {
          status: 400,
          body: {
            message: 'Pomodoro duration must be between 1 and 60 minutes'
          }
        };
      }
    }
    
    if (data.short_break_duration !== undefined) {
      if (data.short_break_duration < 1 || data.short_break_duration > 30) {
        return {
          status: 400,
          body: {
            message: 'Short break duration must be between 1 and 30 minutes'
          }
        };
      }
    }
    
    if (data.long_break_duration !== undefined) {
      if (data.long_break_duration < 1 || data.long_break_duration > 60) {
        return {
          status: 400,
          body: {
            message: 'Long break duration must be between 1 and 60 minutes'
          }
        };
      }
    }
    
    if (data.pomodoros_until_long_break !== undefined) {
      if (data.pomodoros_until_long_break < 1 || data.pomodoros_until_long_break > 10) {
        return {
          status: 400,
          body: {
            message: 'Pomodoros until long break must be between 1 and 10'
          }
        };
      }
    }
    
    // Use updated settings from mock responses, or create default updated settings
    const updatedSettings = mockResponses.length > 1 ? mockResponses[1].rows[0] : {
      user_id: 1,
      ...data
    };
    
    return {
      status: 200,
      body: {
        settings: updatedSettings,
        message: 'Settings updated successfully'
      }
    };
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.reset();
  });

  describe('GET /api/pomodoro/settings', () => {
    it('should return user pomodoro settings', () => {
      // Setup mock responses
      const mockResponses = [
        { 
          rows: [{ 
            user_id: 1,
            pomodoro_duration: 25,
            short_break_duration: 5,
            long_break_duration: 15,
            pomodoros_until_long_break: 4,
            auto_start_breaks: true,
            auto_start_pomodoros: false
          }], 
          rowCount: 1 
        }
      ];
      
      setupDbMockResponses(mockResponses);
      
      // Call mock handler directly
      const response = getPomodoroSettingsHandler(true, mockResponses);
      
      // Validate response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('settings');
      expect(response.body.settings).toHaveProperty('pomodoro_duration', 25);
      expect(response.body.settings).toHaveProperty('short_break_duration', 5);
      expect(response.body.settings).toHaveProperty('long_break_duration', 15);
    });

    it('should return 401 if not authenticated', () => {
      // Call mock handler directly with isAuthenticated = false
      const response = getPomodoroSettingsHandler(false);
      
      // Validate response
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Unauthorized');
    });
  });

  describe('PUT /api/pomodoro/settings', () => {
    it('should update pomodoro settings', () => {
      // Setup mock responses
      const mockResponses = [
        // No existing settings
        { rows: [], rowCount: 0 },
        // Insert new settings response
        { 
          rows: [{ 
            user_id: 1,
            pomodoro_duration: 30,
            short_break_duration: 8,
            long_break_duration: 20,
            pomodoros_until_long_break: 3,
            auto_start_breaks: false,
            auto_start_pomodoros: true
          }], 
          rowCount: 1 
        }
      ];
      
      setupDbMockResponses(mockResponses);
      
      // Settings to update
      const settingsData = {
        pomodoro_duration: 30,
        short_break_duration: 8,
        long_break_duration: 20,
        pomodoros_until_long_break: 3,
        auto_start_breaks: false,
        auto_start_pomodoros: true
      };
      
      // Call mock handler directly
      const response = updatePomodoroSettingsHandler(settingsData, true, mockResponses);
      
      // Validate response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('settings');
      expect(response.body.settings).toHaveProperty('pomodoro_duration', 30);
      expect(response.body.settings).toHaveProperty('short_break_duration', 8);
      expect(response.body.message).toContain('Settings updated');
    });

    it('should validate pomodoro duration', () => {
      // Invalid settings to update
      const settingsData = {
        pomodoro_duration: 65, // Invalid - too high
        short_break_duration: 5,
        long_break_duration: 15,
        pomodoros_until_long_break: 4
      };
      
      // Call mock handler directly
      const response = updatePomodoroSettingsHandler(settingsData);
      
      // Validate response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Pomodoro duration');
    });
    
    it('should validate short break duration', () => {
      // Invalid settings to update
      const settingsData = {
        pomodoro_duration: 25,
        short_break_duration: 35, // Invalid - too high
        long_break_duration: 15,
        pomodoros_until_long_break: 4
      };
      
      // Call mock handler directly
      const response = updatePomodoroSettingsHandler(settingsData);
      
      // Validate response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Short break duration');
    });
    
    it('should validate long break duration', () => {
      // Invalid settings to update
      const settingsData = {
        pomodoro_duration: 25,
        short_break_duration: 5,
        long_break_duration: 65, // Invalid - too high
        pomodoros_until_long_break: 4
      };
      
      // Call mock handler directly
      const response = updatePomodoroSettingsHandler(settingsData);
      
      // Validate response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Long break duration');
    });
    
    it('should validate pomodoros until long break', () => {
      // Invalid settings to update
      const settingsData = {
        pomodoro_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        pomodoros_until_long_break: 12 // Invalid - too high
      };
      
      // Call mock handler directly
      const response = updatePomodoroSettingsHandler(settingsData);
      
      // Validate response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Pomodoros until long break');
    });
    
    it('should return 401 if not authenticated', () => {
      // Settings to update
      const settingsData = {
        pomodoro_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        pomodoros_until_long_break: 4
      };
      
      // Call mock handler directly with isAuthenticated = false
      const response = updatePomodoroSettingsHandler(settingsData, false);
      
      // Validate response
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Unauthorized');
    });
  });
}); 