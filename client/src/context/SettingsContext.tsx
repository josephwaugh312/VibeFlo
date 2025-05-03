import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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

// Helper function to check if settings response is valid
const isValidSettings = (settings: any): boolean => {
  if (!settings) return false;
  if (Array.isArray(settings) && settings.length === 0) return false;
  return typeof settings === 'object' && Object.keys(settings).length > 0;
};

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
          
          // Check if we got a valid settings object
          if (isValidSettings(userSettings)) {
            console.log('Valid settings received from server:', userSettings);
            setSettings(userSettings);
          } else {
            console.warn('Received invalid settings from server:', userSettings);
            // Fall back to default settings + localStorage
            const localSettings = localStorage.getItem('vibeflo_settings');
            if (localSettings) {
              try {
                const parsedSettings = JSON.parse(localSettings);
                console.log('Using settings from localStorage:', parsedSettings);
                setSettings(parsedSettings);
              } catch (parseError) {
                console.error('Error parsing localStorage settings:', parseError);
                setSettings(defaultSettings);
              }
            } else {
              setSettings(defaultSettings);
            }
          }
        } catch (error) {
          console.error('Error fetching user settings:', error);
          // Fall back to default settings
          const localSettings = localStorage.getItem('vibeflo_settings');
          if (localSettings) {
            try {
              const parsedSettings = JSON.parse(localSettings);
              setSettings(parsedSettings);
            } catch (parseError) {
              setSettings(defaultSettings);
            }
          } else {
            setSettings(defaultSettings);
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        // Use default settings when not authenticated
        const localSettings = localStorage.getItem('vibeflo_settings');
        if (localSettings) {
          try {
            const parsedSettings = JSON.parse(localSettings);
            setSettings(parsedSettings);
          } catch (parseError) {
            setSettings(defaultSettings);
          }
        } else {
          setSettings(defaultSettings);
        }
        setIsLoading(false);
      }
    };

    fetchUserSettings();
  }, [isAuthenticated]);

  // Update user settings
  const updateSettings = async (newSettings: Partial<Settings>): Promise<void> => {
    console.log('SettingsContext: updateSettings called with', newSettings);
    try {
      // First, update local state immediately for better UX
      const mergedSettings = { ...settings, ...newSettings };
      setSettings(mergedSettings);
      
      // Save to localStorage as a backup
      localStorage.setItem('vibeflo_settings', JSON.stringify(mergedSettings));
      
      if (isAuthenticated) {
        console.log('User is authenticated, updating on server');
        try {
          setIsLoading(true);
          const updatedSettings = await settingsAPI.updateUserSettings(newSettings);
          
          // Check if we got a valid response
          if (isValidSettings(updatedSettings)) {
            console.log('Settings updated on server, response:', updatedSettings);
            setSettings(updatedSettings);
          } else {
            console.warn('Server returned invalid settings format:', updatedSettings);
            // Keep using our merged settings
            console.log('Continuing with local settings:', mergedSettings);
          }
        } catch (apiError) {
          console.error('API Error updating settings:', apiError);
          // We already updated local settings at the beginning, so no need to do it again
        } finally {
          setIsLoading(false);
        }
      } else {
        // We already updated local settings at the beginning
        console.log('User is not authenticated, settings updated locally');
      }
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