import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { useAuth } from './AuthContext';

interface Settings {
  pomodoro_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  pomodoros_until_long_break: number;
  auto_start_breaks: boolean;
  auto_start_pomodoros: boolean;
  sound_enabled: boolean;
  notification_enabled: boolean;
}

interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
}

// Default settings
const defaultSettings: Settings = {
  pomodoro_duration: 25,
  short_break_duration: 5,
  long_break_duration: 15,
  pomodoros_until_long_break: 4,
  auto_start_breaks: false,
  auto_start_pomodoros: false,
  sound_enabled: true,
  notification_enabled: true
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  updateSettings: async () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  // Fetch user settings when authenticated
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (isAuthenticated) {
        try {
          setIsLoading(true);
          const userSettings = await settingsAPI.getUserSettings();
          setSettings(userSettings);
        } catch (error) {
          console.error('Error fetching user settings:', error);
          // Fall back to default settings
          setSettings(defaultSettings);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Use default settings when not authenticated
        setSettings(defaultSettings);
        setIsLoading(false);
      }
    };

    fetchUserSettings();
  }, [isAuthenticated]);

  // Update user settings
  const updateSettings = async (newSettings: Partial<Settings>): Promise<void> => {
    console.log('SettingsContext: updateSettings called with', newSettings);
    try {
      if (isAuthenticated) {
        console.log('User is authenticated, updating on server');
        try {
          setIsLoading(true);
          const updatedSettings = await settingsAPI.updateUserSettings(newSettings);
          console.log('Settings updated on server, response:', updatedSettings);
          setSettings(updatedSettings);
        } catch (apiError) {
          console.error('API Error updating settings:', apiError);
          // Still update local settings even if server update fails
          const mergedSettings = { ...settings, ...newSettings };
          console.log('Falling back to local settings update:', mergedSettings);
          setSettings(mergedSettings);
          throw apiError;
        } finally {
          setIsLoading(false);
        }
      } else {
        // Update local settings only when not authenticated
        console.log('User is not authenticated, updating locally');
        const mergedSettings = { ...settings, ...newSettings };
        console.log('New merged settings:', mergedSettings);
        setSettings(mergedSettings);
      }
      
      // Don't return the settings object, as the function is declared to return void
    } catch (error) {
      console.error('Error in updateSettings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoading, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 