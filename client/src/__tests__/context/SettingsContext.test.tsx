import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsProvider, useSettings } from '../../context/SettingsContext';
import { settingsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Mock the API service
jest.mock('../../services/api', () => ({
  settingsAPI: {
    getUserSettings: jest.fn(),
    updateUserSettings: jest.fn()
  }
}));

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock console methods to reduce noise in tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  
  // Set default timeout to 10 seconds to avoid timeout failures
  jest.setTimeout(10000);
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Test component to access the context with error handling
const TestComponent = () => {
  const { settings, isLoading, updateSettings } = useSettings();
  
  const handleUpdateClick = async () => {
    try {
      await updateSettings({ pomodoro_duration: 30 });
    } catch (error) {
      // Error is expected in some tests
      console.error('Error caught in TestComponent:', error);
    }
  };
  
  return (
    <div>
      <div data-testid="loading-state">{isLoading ? 'Loading' : 'Loaded'}</div>
      {settings && (
        <>
          <div data-testid="pomodoro-duration">{settings.pomodoro_duration}</div>
          <div data-testid="short-break">{settings.short_break_duration}</div>
          <div data-testid="auto-start-breaks">{settings.auto_start_breaks ? 'true' : 'false'}</div>
          <button 
            data-testid="update-button"
            onClick={handleUpdateClick}
          >
            Update
          </button>
        </>
      )}
    </div>
  );
};

describe('SettingsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should use default settings when not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );
    
    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });
    
    expect(screen.getByTestId('pomodoro-duration')).toHaveTextContent('25');
    expect(screen.getByTestId('short-break')).toHaveTextContent('5');
    expect(screen.getByTestId('auto-start-breaks')).toHaveTextContent('false');
  });
  
  test('should fetch user settings when authenticated', async () => {
    const userSettings = {
      pomodoro_duration: 30,
      short_break_duration: 10,
      long_break_duration: 20,
      pomodoros_until_long_break: 4,
      auto_start_breaks: true,
      auto_start_pomodoros: false,
      sound_enabled: true,
      notification_enabled: true
    };
    
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true });
    (settingsAPI.getUserSettings as jest.Mock).mockResolvedValue(userSettings);
    
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });
    
    expect(screen.getByTestId('pomodoro-duration')).toHaveTextContent('30');
    expect(screen.getByTestId('short-break')).toHaveTextContent('10');
    expect(screen.getByTestId('auto-start-breaks')).toHaveTextContent('true');
  });
  
  test('should update settings locally when not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });
    
    await userEvent.click(screen.getByTestId('update-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('pomodoro-duration')).toHaveTextContent('30');
    });
    
    expect(settingsAPI.updateUserSettings).not.toHaveBeenCalled();
  });
  
  test('should update settings via API when authenticated', async () => {
    const initialSettings = {
      pomodoro_duration: 25,
      short_break_duration: 5,
      long_break_duration: 15,
      pomodoros_until_long_break: 4,
      auto_start_breaks: false,
      auto_start_pomodoros: false,
      sound_enabled: true,
      notification_enabled: true
    };
    
    const updatedSettings = {
      ...initialSettings,
      pomodoro_duration: 30
    };
    
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true });
    (settingsAPI.getUserSettings as jest.Mock).mockResolvedValue(initialSettings);
    (settingsAPI.updateUserSettings as jest.Mock).mockResolvedValue(updatedSettings);
    
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });
    
    await userEvent.click(screen.getByTestId('update-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('pomodoro-duration')).toHaveTextContent('30');
    });
    
    expect(settingsAPI.updateUserSettings).toHaveBeenCalledWith({ pomodoro_duration: 30 });
  });
  
  test('should handle API error when fetching settings', async () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true });
    (settingsAPI.getUserSettings as jest.Mock).mockRejectedValue(new Error('Fetch failed'));
    
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });
    
    // Should fall back to default settings
    expect(screen.getByTestId('pomodoro-duration')).toHaveTextContent('25');
    expect(console.error).toHaveBeenCalled();
  });
  
  test('should handle API error when updating settings', async () => {
    const initialSettings = {
      pomodoro_duration: 25,
      short_break_duration: 5,
      long_break_duration: 15,
      pomodoros_until_long_break: 4,
      auto_start_breaks: false,
      auto_start_pomodoros: false,
      sound_enabled: true,
      notification_enabled: true
    };
    
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true });
    (settingsAPI.getUserSettings as jest.Mock).mockResolvedValue(initialSettings);
    
    // Use a mock implementation that returns a rejected promise
    (settingsAPI.updateUserSettings as jest.Mock).mockImplementation(() => {
      return Promise.reject(new Error('Update failed'));
    });
    
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });
    
    await userEvent.click(screen.getByTestId('update-button'));
    
    // The context should still update the local settings despite the API error
    await waitFor(() => {
      expect(screen.getByTestId('pomodoro-duration')).toHaveTextContent('30');
    });
    
    // Verify that the error was logged
    expect(console.error).toHaveBeenCalled();
  });
  
  test('should handle errors in the updateSettings function', async () => {
    const initialSettings = {
      pomodoro_duration: 25,
      short_break_duration: 5,
      long_break_duration: 15,
      pomodoros_until_long_break: 4,
      auto_start_breaks: false,
      auto_start_pomodoros: false,
      sound_enabled: true,
      notification_enabled: true
    };
    
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true });
    (settingsAPI.getUserSettings as jest.Mock).mockResolvedValue(initialSettings);
    
    // Use a mock implementation that synchronously throws an error
    (settingsAPI.updateUserSettings as jest.Mock).mockImplementation(() => {
      throw new Error('Unexpected error');
    });
    
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });
    
    await userEvent.click(screen.getByTestId('update-button'));
    
    // Verify the error was logged
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });
}); 