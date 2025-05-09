import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService, { settingsAPI } from '../services/api';
import { useAuth } from './AuthContext';

export interface SettingsData {
  id?: string;
  user_id?: string;
  theme_id?: string;
  pomodoro_work_duration?: number;
  pomodoro_break_duration?: number;
  pomodoro_long_break_duration?: number;
  pomodoros_until_long_break?: number;
  auto_start_breaks?: boolean;
  auto_start_pomodoros?: boolean;
  dark_mode?: boolean;
  desktop_notifications?: boolean;
  audio_notifications?: boolean;
  timer_completion_sound?: string;
  [key: string]: any;
}

interface SettingsContextType {
  settings: SettingsData;
  updateSettings: (newSettings: Partial<SettingsData>) => Promise<any>;
  loading: boolean;
}

const defaultSettings: SettingsData = {
  pomodoro_work_duration: 25,
  pomodoro_break_duration: 5,
  pomodoro_long_break_duration: 15,
  pomodoros_until_long_break: 4,
  auto_start_breaks: false,
  auto_start_pomodoros: false,
  dark_mode: false,
  desktop_notifications: true,
  audio_notifications: true,
  timer_completion_sound: 'bell'
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: async () => ({ success: false }),
  loading: true
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  
  // Add retry logic for updating settings
  const updateSettings = async (newSettings: Partial<SettingsData>) => {
    console.log('SettingsContext: updateSettings called with', newSettings);
    
    try {
      // Create a copy of current settings to use for fallback
      const currentSettings = { ...settings };
      
      // If user is authenticated, try to update settings on server with retries
      if (isAuthenticated) {
        console.log('User is authenticated, updating on server');
        
        try {
          // Use the API service's retry functionality if available
          if ('retryRequest' in apiService) {
            // Using the exposed retry request helper
            const response = await apiService.retryRequest(() => 
              settingsAPI.updateUserSettings(newSettings)
            );
            console.log('Settings updated on server, response:', response);
            setSettings({ ...currentSettings, ...newSettings });
            return { success: true, data: response };
          } else {
            // Fallback to regular API call
            const response = await settingsAPI.updateUserSettings(newSettings);
            console.log('Settings updated on server, response:', response);
            setSettings({ ...currentSettings, ...newSettings });
            return { success: true, data: response };
          }
        } catch (error) {
          console.error('API Error updating settings:', error);
          // Fall back to updating locally only
          console.log('Falling back to local settings update:', currentSettings);
          
          // Merge new settings with current settings and update local state
          const updatedSettings = { ...currentSettings, ...newSettings };
          setSettings(updatedSettings);
          
          // Save to localStorage as a backup
          localStorage.setItem('settings', JSON.stringify(updatedSettings));
          
          // Return partial success
          console.error('Error in updateSettings:', error);
          return { 
            success: true, 
            local: true, 
            message: 'Settings updated locally only due to server error'
          };
        }
      } else {
        console.log('User is not authenticated, updating locally only');
        // If not authenticated, update settings in localStorage only
        const updatedSettings = { ...currentSettings, ...newSettings };
        setSettings(updatedSettings);
        localStorage.setItem('settings', JSON.stringify(updatedSettings));
        return { success: true, local: true };
      }
    } catch (error) {
      console.error('Error in updateSettings:', error);
      return { success: false, error: error };
    }
  };
  
  // Load settings from API or localStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (isAuthenticated) {
          try {
            const serverSettings = await settingsAPI.getUserSettings();
            if (serverSettings) {
              setSettings(serverSettings);
              console.log('Loaded settings from server:', serverSettings);
            }
          } catch (error) {
            console.error('Error loading settings from server:', error);
            // Fall back to localStorage if available
            const storedSettings = localStorage.getItem('settings');
            if (storedSettings) {
              setSettings(JSON.parse(storedSettings));
              console.log('Loaded settings from localStorage');
            }
          }
        } else {
          const storedSettings = localStorage.getItem('settings');
          if (storedSettings) {
            setSettings(JSON.parse(storedSettings));
            console.log('Loaded settings from localStorage');
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [isAuthenticated]);
  
  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

export default SettingsContext; 