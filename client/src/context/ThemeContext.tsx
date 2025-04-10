import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { themeAPI } from '../services/api';
import { useAuth } from './AuthContext';

// Constants for local storage
const LOCAL_STORAGE_THEME_KEY = 'vibeflo_current_theme';

interface Theme {
  id: number;
  name: string;
  description: string | null;
  image_url: string;
  is_default?: boolean;
  is_premium?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CustomTheme extends Theme {
  user_id: number;
  is_public: boolean;
  prompt?: string;
}

interface ThemeContextType {
  currentTheme: Theme | null;
  availableThemes: Theme[];
  customThemes: CustomTheme[];
  publicCustomThemes: CustomTheme[];
  loading: boolean;
  loadingThemes: boolean;
  setActiveTheme: (themeId: number) => Promise<void>;
  setCurrentTheme: (theme: Theme) => void;
  createCustomTheme: (themeData: {
    name: string;
    description?: string;
    image_url: string;
    is_public?: boolean;
    prompt?: string;
  }) => Promise<CustomTheme>;
  deleteCustomTheme: (id: number) => Promise<void>;
  refreshThemes: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);
  const [availableThemes, setAvailableThemes] = useState<Theme[]>([]);
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [publicCustomThemes, setPublicCustomThemes] = useState<CustomTheme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingThemes, setLoadingThemes] = useState<boolean>(true);
  const { isAuthenticated } = useAuth();

  // Load theme from local storage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
      if (savedTheme) {
        return JSON.parse(savedTheme);
      }
    } catch (err) {
      console.error('Error loading theme from localStorage:', err);
    }
    return null;
  }, []);

  // Save theme to local storage
  const saveToLocalStorage = useCallback((theme: Theme) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, JSON.stringify(theme));
    } catch (err) {
      console.error('Error saving theme to localStorage:', err);
    }
  }, []);

  // Override the default setCurrentTheme to also save to localStorage
  const handleSetCurrentTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    saveToLocalStorage(theme);
  };

  // Fetch available themes
  const fetchAvailableThemes = useCallback(async () => {
    try {
      setLoadingThemes(true);
      const themes = await themeAPI.getAllThemes();
      setAvailableThemes(themes);
    } catch (error) {
      console.error('Error fetching available themes:', error);
    } finally {
      setLoadingThemes(false);
    }
  }, []);

  // Fetch public custom themes
  const fetchPublicCustomThemes = useCallback(async () => {
    try {
      const themes = await themeAPI.getPublicCustomThemes();
      setPublicCustomThemes(themes);
    } catch (error) {
      console.error('Error fetching public custom themes:', error);
    }
  }, []);

  // Fetch user's custom themes
  const fetchUserCustomThemes = useCallback(async () => {
    try {
      const themes = await themeAPI.getUserCustomThemes();
      setCustomThemes(themes);
    } catch (error) {
      console.error('Error fetching user custom themes:', error);
    }
  }, []);

  // Fetch user's active theme
  const fetchUserTheme = useCallback(async () => {
    try {
      setLoading(true);
      
      // Helper function to validate base64 URLs
      const validateUrl = (url: string): boolean => {
        if (url && url.startsWith('data:image')) {
          // Base64 URLs should have a comma and sufficient data length
          return url.includes(',') && url.split(',')[1].length >= 10;
        }
        return true; // Non-base64 URLs pass validation
      };
      
      // Helper function to normalize theme URLs
      const normalizeThemeUrls = (theme: any) => {
        const normalizedTheme = { ...theme };
        
        // Ensure image_url and background_url are set and valid
        if (!normalizedTheme.image_url && normalizedTheme.background_url) {
          normalizedTheme.image_url = normalizedTheme.background_url;
        } else if (normalizedTheme.image_url && !normalizedTheme.background_url) {
          normalizedTheme.background_url = normalizedTheme.image_url;
        }
        
        // Validate and fix any invalid base64 URLs
        if (!validateUrl(normalizedTheme.image_url)) {
          console.error('Invalid image_url detected in theme:', normalizedTheme.name);
          normalizedTheme.image_url = '/images/themes/default.jpg';
        }
        
        if (!validateUrl(normalizedTheme.background_url)) {
          console.error('Invalid background_url detected in theme:', normalizedTheme.name);
          normalizedTheme.background_url = '/images/themes/default.jpg';
        }
        
        return normalizedTheme;
      };
      
      // First try to get from localStorage
      const localTheme = loadFromLocalStorage();
      if (localTheme) {
        // Apply normalization to local theme
        const normalizedTheme = normalizeThemeUrls(localTheme);
        
        setCurrentTheme(normalizedTheme);
        setLoading(false);
        
        // Still get from server in background for sync purposes
        try {
          const serverTheme = await themeAPI.getUserTheme();
          
          // Update local theme if the server version is different
          if (serverTheme.id !== normalizedTheme.id) {
            console.log("Server theme differs from local, updating to:", serverTheme.name);
            // Apply normalization to server theme
            const normalizedServerTheme = normalizeThemeUrls(serverTheme);
            
            setCurrentTheme(normalizedServerTheme);
            saveToLocalStorage(normalizedServerTheme);
          }
        } catch (backgroundErr) {
          // Ignore background fetch errors
          console.log("Background fetch error (non-critical):", backgroundErr);
        }
        
        return;
      }
      
      // If no localStorage theme, get from server
      const theme = await themeAPI.getUserTheme();
      console.log("Fetched theme from server:", theme);
      
      // Apply normalization to server theme
      const normalizedTheme = normalizeThemeUrls(theme);
      
      // If URLs are still missing, use a default
      if (!normalizedTheme.image_url) {
        normalizedTheme.image_url = '/images/themes/default.jpg';
        normalizedTheme.background_url = '/images/themes/default.jpg';
        console.warn("Applied default fallback image for theme:", normalizedTheme.name);
      }
      
      // Save to localStorage and set as current
      setCurrentTheme(normalizedTheme);
      saveToLocalStorage(normalizedTheme);
      
    } catch (error) {
      console.error('Error fetching user theme:', error);
      // If error, set to Minimalist theme (ID 4)
      const minimalistTheme = availableThemes.find(theme => theme.id === 4) || 
                              availableThemes.find(theme => theme.is_default);
      if (minimalistTheme) {
        // Ensure the theme has an image URL
        if (!minimalistTheme.image_url) {
          minimalistTheme.image_url = '/images/themes/default.jpg';
        }
        // Create a normalized copy
        const normalizedDefault = { ...minimalistTheme };
        (normalizedDefault as any).background_url = normalizedDefault.image_url;
        
        setCurrentTheme(normalizedDefault);
        saveToLocalStorage(normalizedDefault);
      }
    } finally {
      setLoading(false);
    }
  }, [availableThemes, loadFromLocalStorage, saveToLocalStorage]);

  // Fetch available themes on mount
  useEffect(() => {
    fetchAvailableThemes();
    fetchPublicCustomThemes();
  }, [fetchAvailableThemes, fetchPublicCustomThemes]);

  // Fetch user's active theme when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserTheme();
      fetchUserCustomThemes();
    } else {
      // If not authenticated, set Minimalist theme (ID 4) as default
      const minimalistTheme = availableThemes.find(theme => theme.id === 4) || 
                              availableThemes.find(theme => theme.is_default);
      if (minimalistTheme) {
        // Create a normalized copy with background_url
        const normalizedTheme = { ...minimalistTheme };
        if (!normalizedTheme.image_url) {
          normalizedTheme.image_url = '/images/themes/default.jpg';
        }
        (normalizedTheme as any).background_url = normalizedTheme.image_url;
        
        setCurrentTheme(normalizedTheme);
        saveToLocalStorage(normalizedTheme);
      }
      setLoading(false);
    }
  }, [isAuthenticated, availableThemes, fetchUserTheme, fetchUserCustomThemes, saveToLocalStorage]);

  // Set active theme
  const setActiveTheme = async (themeId: number) => {
    try {
      setLoading(true);
      console.log(`Setting active theme with ID: ${themeId}`);
      
      // Determine if this is a standard theme
      const isStandardTheme = availableThemes.some(t => t.id === themeId);
      const isUserCustomTheme = customThemes.some(t => t.id === themeId);
      const isPublicCustomTheme = publicCustomThemes.some(t => t.id === themeId);
      
      console.log(`Theme ID ${themeId} type:`, { 
        isStandardTheme, 
        isUserCustomTheme, 
        isPublicCustomTheme 
      });
      
      // Find the theme from the appropriate collection
      let newTheme = null;
      
      if (isStandardTheme) {
        newTheme = availableThemes.find(t => t.id === themeId);
        console.log("Selected standard theme:", newTheme?.name);
      } else if (isUserCustomTheme) {
        newTheme = customThemes.find(t => t.id === themeId);
        console.log("Selected user custom theme:", newTheme?.name);
      } else if (isPublicCustomTheme) {
        newTheme = publicCustomThemes.find(t => t.id === themeId);
        console.log("Selected public custom theme:", newTheme?.name);
      }
      
      if (newTheme) {
        // Create a copy of the theme
        const updatedTheme = {...newTheme};
        
        // Ensure image_url and background_url are consistent
        if (!updatedTheme.image_url && (updatedTheme as any).background_url) {
          updatedTheme.image_url = (updatedTheme as any).background_url;
        } else if (updatedTheme.image_url && !(updatedTheme as any).background_url) {
          (updatedTheme as any).background_url = updatedTheme.image_url;
        }
        
        // Validate base64 URLs
        const validateUrl = (url: string): boolean => {
          if (url && url.startsWith('data:image')) {
            // Base64 URLs should have a comma and sufficient data length
            return url.includes(',') && url.split(',')[1].length >= 10;
          }
          return true; // Non-base64 URLs pass validation
        };
        
        // Check and reset invalid URLs
        if (!validateUrl(updatedTheme.image_url)) {
          console.error('Invalid image_url detected, falling back to default');
          updatedTheme.image_url = '/images/themes/default.jpg';
        }
        
        if (!validateUrl((updatedTheme as any).background_url)) {
          console.error('Invalid background_url detected, falling back to default');
          (updatedTheme as any).background_url = '/images/themes/default.jpg';
        }
        
        console.log("Setting theme:", updatedTheme);
        
        // Apply theme locally immediately
        setCurrentTheme(updatedTheme);
        saveToLocalStorage(updatedTheme);
      }
      
      // Tell the server about the theme selection
      await themeAPI.setUserTheme(themeId);
      
    } catch (error) {
      console.error('Error setting active theme:', error);
      
      // If there was an error, try to load from localStorage as fallback
      const localTheme = loadFromLocalStorage();
      if (localTheme) {
        setCurrentTheme(localTheme);
      }
    } finally {
      setLoading(false);
    }
  };

  // Create custom theme
  const createCustomTheme = async (themeData: {
    name: string;
    description?: string;
    image_url: string;
    is_public?: boolean;
    prompt?: string;
  }): Promise<CustomTheme> => {
    try {
      // Validate the base64 URL if present
      const validateUrl = (url: string): boolean => {
        if (url && url.startsWith('data:image')) {
          // Base64 URLs should have a comma and sufficient data length
          return url.includes(',') && url.split(',')[1].length >= 10;
        }
        return true; // Non-base64 URLs pass validation
      };

      const themeDataToSave = { ...themeData };
      
      // Check and handle invalid base64 URLs
      if (!validateUrl(themeDataToSave.image_url)) {
        console.error('Invalid image_url in createCustomTheme, falling back to default');
        themeDataToSave.image_url = '/images/themes/default.jpg';
      }
      
      const newTheme = await themeAPI.createCustomTheme(themeDataToSave);
      setCustomThemes(prev => [newTheme, ...prev]);
      
      if (newTheme.is_public) {
        await fetchPublicCustomThemes(); // Refresh public themes
      }
      
      return newTheme;
    } catch (error) {
      console.error('Error creating custom theme:', error);
      throw error;
    }
  };

  // Delete custom theme
  const deleteCustomTheme = async (id: number) => {
    try {
      await themeAPI.deleteCustomTheme(id);
      setCustomThemes(prev => prev.filter(theme => theme.id !== id));
      
      // If current theme is the deleted one, set to Minimalist theme (ID 4)
      if (currentTheme?.id === id) {
        const minimalistTheme = availableThemes.find(theme => theme.id === 4) || 
                                availableThemes.find(theme => theme.is_default);
        if (minimalistTheme) {
          // Create a normalized copy
          const normalizedTheme = { ...minimalistTheme };
          if (!normalizedTheme.image_url) {
            normalizedTheme.image_url = '/images/themes/default.jpg';
          }
          (normalizedTheme as any).background_url = normalizedTheme.image_url;
          
          setCurrentTheme(normalizedTheme);
          saveToLocalStorage(normalizedTheme);
          await themeAPI.setUserTheme(minimalistTheme.id);
        }
      }
      
      // Refresh public themes in case a public theme was deleted
      await fetchPublicCustomThemes();
    } catch (error) {
      console.error('Error deleting custom theme:', error);
      throw error;
    }
  };

  // Refresh all themes data
  const refreshThemes = async () => {
    await fetchAvailableThemes();
    if (isAuthenticated) {
      await fetchUserCustomThemes();
      await fetchUserTheme();
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        availableThemes,
        customThemes,
        publicCustomThemes,
        loading,
        loadingThemes,
        setActiveTheme,
        setCurrentTheme: handleSetCurrentTheme,
        createCustomTheme,
        deleteCustomTheme,
        refreshThemes
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}; 