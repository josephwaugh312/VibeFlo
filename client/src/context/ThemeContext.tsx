import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Constants for local storage
const LOCAL_STORAGE_THEME_KEY = 'selectedTheme';

// Create a fallback SVG for broken images
const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%238e44ad;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%233498db;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="800" height="800" fill="url(%23grad)"%3E%3C/rect%3E%3Cpath d="M0 0L800 800" stroke="%23ffffff20" stroke-width="15"%3E%3C/path%3E%3Cpath d="M800 0L0 800" stroke="%23ffffff20" stroke-width="15"%3E%3C/path%3E%3C/svg%3E';

// Define minimal theme types
interface Theme {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  background_url?: string;
  is_default?: boolean;
  is_premium?: boolean;
  is_standard?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CustomTheme extends Theme {
  user_id: string;
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
  setActiveTheme: (themeId: string | number) => Promise<void>;
  setCurrentTheme: (theme: Theme) => void;
  createCustomTheme: (themeData: {
    name: string;
    description?: string;
    image_url: string;
    is_public?: boolean;
    prompt?: string;
  }) => Promise<CustomTheme>;
  deleteCustomTheme: (id: string) => Promise<void>;
  refreshThemes: () => Promise<void>;
}

// Create a default theme
const defaultTheme: Theme = {
  id: 'default-abstract-theme',
  name: 'Abstract',
  description: 'Colorful abstract patterns',
  image_url: FALLBACK_IMAGE,
  is_default: true
};

// Apply background utility function
const applyBackground = (theme: Theme | CustomTheme | null) => {
  if (!theme) {
    console.warn('No theme provided, using default gradient');
    document.body.style.backgroundImage = 'linear-gradient(135deg, #8e44ad 0%, #3498db 100%)';
    return;
  }

  console.log('Applying background from theme:', theme.name);
  
  try {
    // Get the image URL - try different property names
    const imageUrl = theme.background_url || theme.image_url;
    
    if (!imageUrl) {
      console.warn(`No image URL found in theme "${theme.name}", using default gradient`);
      document.body.style.backgroundImage = 'linear-gradient(135deg, #8e44ad 0%, #3498db 100%)';
      return;
    }
    
    console.log(`Using background image URL for "${theme.name}" (first 100 chars):`, 
      imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : ''));
    
    // Ensure base64 images are treated as URLs
    const isBase64 = imageUrl.startsWith('data:');
    const isGradient = imageUrl.startsWith('linear-gradient');
    const isImageUrl = !isGradient && !isBase64;
    
    // Format the CSS value appropriately based on type
    const imageUrlForCSS = isImageUrl ? `url("${imageUrl}")` : 
                          isBase64 ? `url(${imageUrl})` : 
                          imageUrl;
    
    console.log(`Background type: ${isImageUrl ? 'URL' : isBase64 ? 'Base64' : 'Gradient'}`);
    
    // Clear existing background first
    document.body.style.background = 'none';
    
    // Set the background properties
    document.body.style.backgroundImage = imageUrlForCSS;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundRepeat = 'no-repeat';
    
    // Force a repaint to ensure background updates
    void document.body.offsetHeight;
    
    // Verify that the background was actually set
    setTimeout(() => {
      const computedBg = window.getComputedStyle(document.body).backgroundImage;
      if (computedBg === 'none' || computedBg === '') {
        console.warn('Background application verification failed, applying fallback');
        document.body.style.backgroundImage = 'linear-gradient(135deg, #8e44ad 0%, #3498db 100%)';
      } else {
        console.log('Background successfully applied and verified');
      }
    }, 100);
  } catch (error) {
    console.error('Error applying background:', error);
    // Apply a fallback gradient in case of errors
    document.body.style.backgroundImage = 'linear-gradient(135deg, #8e44ad 0%, #3498db 100%)';
  }
};

// Get server URL with development fallback
const getServerUrl = () => {
  // Use environment variable if available
  const envUrl = process.env.REACT_APP_SERVER_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Development fallback - use localhost if we're in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Using development server URL fallback');
    return 'http://localhost:5000';
  }
  
  return '';
};

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(defaultTheme);
  const [availableThemes, setAvailableThemes] = useState<Theme[]>([defaultTheme]);
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [publicCustomThemes, setPublicCustomThemes] = useState<CustomTheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingThemes, setLoadingThemes] = useState(true);
  
  // Fetch all available themes
  const fetchAvailableThemes = async () => {
    console.log('Fetching available themes...');
    setLoadingThemes(true);
    
    try {
      // Make sure we have a valid server URL
      const serverUrl = getServerUrl();
      if (!serverUrl) {
        console.warn('REACT_APP_SERVER_URL is not defined, using fallback themes');
        setAvailableThemes([defaultTheme]);
        setLoadingThemes(false);
        return;
      }

      // Log the server URL for debugging
      console.log('Using server URL:', serverUrl);
      
      const response = await axios.get(`${serverUrl}/api/themes`);
      if (response.data && Array.isArray(response.data)) {
        console.log('Themes fetched successfully:', response.data.length, 'themes');
        
        // Filter standard themes (those with is_standard=true or in standard themes IDs)
        const standardThemeIds = [
          'd8a7c463-e2a0-4b15-9c1b-cb1d4e59d933',
          'fd8b7d61-fec0-48e6-a2da-52a1b5c9887c',
          '550e8400-e29b-41d4-a716-446655440000',
          'a3e0f1d8-5c22-4b23-9c5a-b1d1c1a9b7a2',
          'e4b0c7d2-267a-4c46-860a-e6c48cc0d4e0',
          'b5f87e7c-f98a-4a5e-8f8a-7e5b8be2b35d',
          'f48a7dc2-3b8a-49e7-b8c8-6a32d1e0c1b9',
          'c9d5a8f1-2b7c-4e9c-b1a3-9e5c8d7f6a2e',
          'd7e6f5c4-3b2a-1c9d-8e7f-6a5b4c3d2e1f',
          'e2d3c4b5-a6b7-c8d9-e0f1-a2b3c4d5e6f7'
        ];
        
        const standardThemes = response.data.filter((theme: Theme) => 
          theme.is_standard === true || standardThemeIds.includes(theme.id)
        );
        
        // Ensure we always have at least the default theme
        const themes = standardThemes.length > 0 
          ? standardThemes 
          : [defaultTheme];
        
        setAvailableThemes(themes);
        
        // If no current theme is set, try to find the default or first available
        if (!currentTheme) {
          const defaultFromApi = themes.find(theme => theme.is_default);
          const abstractTheme = themes.find(theme => theme.name === 'Abstract');
          const fallbackTheme = defaultFromApi || abstractTheme || themes[0];
          
          if (fallbackTheme) {
            console.log('Setting default theme:', fallbackTheme.name);
            setCurrentTheme(fallbackTheme);
            applyBackground(fallbackTheme);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching themes:', error);
      // Ensure we have at least the default theme
      setAvailableThemes([defaultTheme]);
      
      if (!currentTheme) {
        setCurrentTheme(defaultTheme);
      }
    } finally {
      setLoadingThemes(false);
    }
  };
  
  // Function to fetch custom themes belonging to the user
  const fetchCustomThemes = async () => {
    // Only attempt if we have a token
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping custom theme fetch');
      setCustomThemes([]);
      return;
    }

    try {
      const serverUrl = getServerUrl();
      if (!serverUrl) {
        console.warn('REACT_APP_SERVER_URL is not defined, cannot fetch custom themes');
        setCustomThemes([]);
        return;
      }
      
      console.log('Fetching custom themes for user...');
      const response = await axios.get(`${serverUrl}/api/themes/custom/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Custom themes fetched successfully:', response.data.length, 'custom themes');
        
        // Filter out any standard themes that might have been returned
        const nonStandardThemes = response.data.filter((theme: CustomTheme) => 
          theme.is_standard !== true
        );
        
        setCustomThemes(nonStandardThemes);
      }
    } catch (error) {
      console.error('Error fetching custom themes:', error);
      setCustomThemes([]);
    }
  };

  // Function to fetch public custom themes
  const fetchPublicCustomThemes = async () => {
    try {
      // Get the server URL
      const serverUrl = getServerUrl();
      if (!serverUrl) {
        console.warn('Server URL is not defined, skipping public theme fetch');
        return;
      }
      
      console.log('Fetching public custom themes...');
      const response = await axios.get(`${serverUrl}/api/themes/custom/public`);
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Public custom themes fetched:', response.data.length);
        setPublicCustomThemes(response.data);
      }
    } catch (error) {
      console.error('Error fetching public custom themes:', error);
    }
  };

  // Fetch all themes in sequence
  const fetchAllThemes = async () => {
    await fetchAvailableThemes();
    await fetchCustomThemes();
    await fetchPublicCustomThemes();
  };
  
  // Initialize themes on mount
  useEffect(() => {
    // Try to load theme from localStorage first
    const storedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
    
    if (storedTheme) {
      try {
        const parsedTheme = JSON.parse(storedTheme);
        console.log('Loading theme from localStorage:', parsedTheme.name);
        setCurrentTheme(parsedTheme);
        applyBackground(parsedTheme);
      } catch (error) {
        console.error('Error parsing stored theme:', error);
        // If error loading from localStorage, apply default
        applyBackground(defaultTheme);
      }
    } else {
      // If no stored theme, apply default
      applyBackground(defaultTheme);
    }
    
    // Fetch all theme types
    fetchAllThemes();
    // We disable the exhaustive-deps warning because we only want to run this once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Safety check to ensure a theme is applied after initial loading
  useEffect(() => {
    // Only execute after themes have been loaded
    if (!loadingThemes) {
      console.log('Safety check for theme application');
      
      // If no current theme is set, find a suitable default
      if (!currentTheme && availableThemes.length > 0) {
        console.log('No current theme set after loading, applying default');
        
        // Try to find a specific theme, falling back to the first available
        const defaultFromApi = availableThemes.find(theme => theme.is_default);
        const abstractTheme = availableThemes.find(theme => theme.name === 'Abstract');
        const fallbackTheme = defaultFromApi || abstractTheme || availableThemes[0];
        
        // Set and apply the theme
        if (fallbackTheme) {
          console.log('Setting fallback theme:', fallbackTheme.name);
          setCurrentTheme(fallbackTheme);
          applyBackground(fallbackTheme);
          localStorage.setItem(LOCAL_STORAGE_THEME_KEY, JSON.stringify(fallbackTheme));
        }
      } else if (currentTheme) {
        // Ensure the background is applied for the current theme
        console.log('Ensuring background is applied for current theme:', currentTheme.name);
        applyBackground(currentTheme);
      } else {
        // Last resort fallback
        console.warn('No themes available, applying default gradient');
        applyBackground(defaultTheme);
      }
    }
  }, [loadingThemes, currentTheme, availableThemes]);
  
  // Function to set the active theme
  const setActiveTheme = async (themeId: string | number) => {
    console.log(`Setting active theme with ID: ${themeId}`);
    setLoading(true);
    
    try {
      // Convert numeric IDs to strings for consistent comparison
      const themeIdStr = typeof themeId === 'number' ? String(themeId) : themeId;
      
      // Default UUID to use if needed
      const fallbackUuid = "00000000-0000-0000-0000-000000000000";
      
      // Find the theme in all collections
      let selectedTheme: Theme | CustomTheme | null = 
        availableThemes.find(t => t.id.toString() === themeIdStr.toString()) ||
        customThemes.find(t => t.id.toString() === themeIdStr.toString()) ||
        publicCustomThemes.find(t => t.id.toString() === themeIdStr.toString()) ||
        null;
      
      if (!selectedTheme) {
        console.warn(`Theme with ID ${themeId} not found in any collection, using default`);
        selectedTheme = defaultTheme;
      }
      
      console.log(`Found theme:`, selectedTheme);
      console.log(`Image URL: ${selectedTheme.background_url || selectedTheme.image_url}`);
      
      // Set the theme in state
      setCurrentTheme(selectedTheme as Theme);
      
      // Apply the background
      applyBackground(selectedTheme);
      
      // Save theme to localStorage for persistence
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, JSON.stringify(selectedTheme));
      
      // Send theme preference to server if we have authentication
      const serverUrl = getServerUrl();
      const token = localStorage.getItem('token');
      
      if (!serverUrl || !token) {
        console.warn('Server URL or token not available. Theme preference will not be saved to server.');
        return;
      }
      
      // Get the actual theme ID - make sure it's not undefined
      const idForServer = selectedTheme.id || fallbackUuid;
      console.log(`Using ID for server: ${idForServer}`);
      
      // Check if the ID is numeric and convert to proper format for server
      // Safely check if it's a string and includes hyphens (UUID format)
      const idString = String(idForServer); // Ensure we have a string
      const isUuidFormat = idString.includes('-');
      const isNumericId = !isNaN(Number(idString)) && !isUuidFormat;
      
      // For numeric IDs, either use a UUID-compatible format or a different API endpoint
      if (isNumericId) {
        console.log('Numeric ID detected, using local theme only without server sync');
        // Store in localStorage but don't try to save to server for numeric IDs
        // This is a workaround until the server is updated to handle numeric IDs
        return;
      }
      
      // Otherwise, proceed with the server update for UUID-format IDs
      // PUT to /api/themes/user
      const response = await fetch(`${serverUrl}/api/themes/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ theme_id: idString })
      });
      
      if (response.ok) {
        console.log('Theme preference saved to server successfully');
      } else {
        console.warn('Failed to save theme preference to server', await response.text());
      }
    } catch (error) {
      console.error('Error setting active theme:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to create a custom theme
  const createCustomTheme = async (themeData: {
    name: string;
    description?: string;
    image_url: string;
    is_public?: boolean;
    prompt?: string;
  }) => {
    setLoading(true);
    
    try {
      // Get the server URL
      const serverUrl = getServerUrl();
      if (!serverUrl) {
        throw new Error('Server URL is not defined');
      }
      
      const response = await axios.post(
        `${serverUrl}/api/themes/custom`,
        themeData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      const newTheme = response.data;
      setCustomThemes(prev => [...prev, newTheme]);
      
      // If it's public, also add to public themes
      if (themeData.is_public) {
        setPublicCustomThemes(prev => [...prev, newTheme]);
      }
      
      toast.success('Custom theme created!');
      return newTheme;
    } catch (error) {
      console.error('Error creating custom theme:', error);
      toast.error('Failed to create custom theme');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Function to delete a custom theme
  const deleteCustomTheme = async (id: string) => {
    setLoading(true);
    
    try {
      // Get the server URL
      const serverUrl = getServerUrl();
      if (!serverUrl) {
        throw new Error('Server URL is not defined');
      }
      
      await axios.delete(`${serverUrl}/api/themes/custom/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Remove from our state
      setCustomThemes(prev => prev.filter(theme => theme.id !== id));
      setPublicCustomThemes(prev => prev.filter(theme => theme.id !== id));
      
      // If the current theme is the deleted one, switch to default
      if (currentTheme && currentTheme.id === id) {
        const defaultFromApi = availableThemes.find(theme => theme.is_default);
        if (defaultFromApi) {
          setCurrentTheme(defaultFromApi);
          applyBackground(defaultFromApi);
        }
      }
      
      toast.success('Custom theme deleted');
    } catch (error) {
      console.error('Error deleting custom theme:', error);
      toast.error('Failed to delete custom theme');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Function to refresh all themes
  const refreshThemes = async () => {
    await fetchAllThemes();
    return Promise.resolve();
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
        setCurrentTheme,
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