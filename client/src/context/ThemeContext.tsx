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
  background_color?: string;
  text_color?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  is_dark?: boolean;
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
  id: 'e4b0c7d2-267a-4c46-860a-e6c48cc0d4e0',
  name: 'Minimalist',
  description: 'Clean, minimalist background with subtle geometric patterns',
  background_color: '#FFFFFF',
  text_color: '#333333',
  primary_color: '#9C27B0',
  secondary_color: '#E91E63',
  accent_color: '#00BCD4',
  is_dark: false,
  is_default: true,
  image_url: 'https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200'
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

    console.log('Token found, proceeding with custom theme fetch');
    try {
      const serverUrl = getServerUrl();
      if (!serverUrl) {
        console.warn('REACT_APP_SERVER_URL is not defined, cannot fetch custom themes');
        setCustomThemes([]);
        return;
      }
      
      // Log token length for debugging (not the actual token for security)
      console.log(`Fetching custom themes with token (length: ${token.length})`);
      
      // Get the current user ID by decoding the JWT token
      let currentUserId = '';
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          currentUserId = payload.id || '';
          console.log("Current user ID:", currentUserId);
        }
      } catch (e) {
        console.warn('Could not decode token for user ID:', e);
      }
      
      console.log('Fetching custom themes for user...');
      const response = await axios.get(`${serverUrl}/api/themes/custom/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Custom themes fetched successfully:', response.data.length, 'custom themes');
        
        // Filter out standard themes and unwanted themes
        const unwantedThemeIds = [
          // Numeric IDs
          '24', '25', '26', '27', '28', '29', '30', '31', '32',
          // Also include string representations of the same IDs
          24, 25, 26, 27, 28, 29, 30, 31, 32
        ];
        
        // These are themes that should be filtered out when we retrieve from the server API
        // This is different from the userPublicThemes which might include these themes
        const unwantedNames = ["Deep Purple", "Dark Theme", "Ocean Blue", "Forest Green", "Sunset Orange"];
        
        console.log('Before filtering:', response.data.length, 'custom themes');
        const filteredThemes = response.data.filter((theme: CustomTheme) => {
          // Always keep standard themes
          if (theme.is_standard === true) {
            return true;
          }
          
          // Filter out unwanted themes by ID
          if (unwantedThemeIds.includes(theme.id) || unwantedThemeIds.includes(Number(theme.id))) {
            console.log(`Filtering out unwanted theme from custom themes: ${theme.name} (ID: ${theme.id})`);
            return false;
          }
          
          // Filter out unwanted themes by name
          if (unwantedNames.includes(theme.name)) {
            console.log(`Filtering out unwanted theme by name from custom themes: ${theme.name} (ID: ${theme.id})`);
            return false;
          }
          
          return true;
        });
        console.log('After filtering:', filteredThemes.length, 'custom themes');
        
        // We'll use this filtered list from API, but we also need to fetch public themes
        // Your user's actual custom themes (the Tokyo Chill, Lo-Fi, etc.) will be in filteredThemes
        
        // Make a request to get public themes as well (to handle themes created on a different deployment)
        try {
          console.log('Fetching public themes to check for user themes');
          const publicResponse = await axios.get(`${serverUrl}/api/themes/custom/public`);
          
          if (publicResponse.data && Array.isArray(publicResponse.data)) {
            // Filter to only get public themes created by this user
            const userPublicThemes = publicResponse.data.filter((theme: CustomTheme) => 
              theme.user_id === currentUserId
            );
            
            if (userPublicThemes.length > 0) {
              console.log(`Found ${userPublicThemes.length} public themes created by this user`);
              
              // We want to be careful about which themes we add back to the custom themes list
              // Only add back themes that the user actually created and aren't in the unwanted lists
              
              // Get list of theme names we already have in filteredThemes
              const existingThemeNames = filteredThemes.map(theme => theme.name);
              
              for (const publicTheme of userPublicThemes) {
                // Don't add back the filtered themes that are in the unwanted list
                if (unwantedNames.includes(publicTheme.name)) continue;
                
                // Check if the theme already exists in our list
                if (!existingThemeNames.includes(publicTheme.name)) {
                  console.log(`Adding public theme "${publicTheme.name}" to user's custom themes`);
                  filteredThemes.push(publicTheme);
                }
              }
            }
          }
        } catch (publicError) {
          console.error('Error fetching public themes for user check:', publicError);
        }
        
        setCustomThemes(filteredThemes);
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
      
      // Get the current user ID if logged in
      const token = localStorage.getItem('token');
      let currentUserId = '';
      
      if (token) {
        try {
          // Try to decode the JWT token to get the user ID
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            currentUserId = payload.id || '';
            console.log('Current user ID for theme filtering:', currentUserId);
          }
        } catch (e) {
          console.warn('Could not decode token for user ID:', e);
        }
      }
      
      console.log('Fetching public custom themes...');
      const response = await axios.get(`${serverUrl}/api/themes/custom/public`);
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Public custom themes fetched:', response.data.length);
        
        // List of unwanted theme IDs (from your console log)
        const unwantedThemeIds = [
          // Numeric IDs
          '24', '25', '26', '27', '28', '29', '30', '31', '32',
          // Also include string representations of the same IDs
          24, 25, 26, 27, 28, 29, 30, 31, 32
        ];
        
        // Filter out unwanted themes
        const filteredThemes = response.data.filter((theme: CustomTheme) => {
          // Skip themes with IDs in the unwanted list
          if (unwantedThemeIds.includes(theme.id) || unwantedThemeIds.includes(Number(theme.id))) {
            console.log(`Filtering out unwanted theme: ${theme.name} (ID: ${theme.id})`);
            return false;
          }
          
          // Skip themes with names that match patterns of unwanted themes
          const unwantedNames = ["Deep Purple", "Dark Theme", "Ocean Blue", "Forest Green", "Sunset Orange"];
          if (unwantedNames.includes(theme.name)) {
            // Only remove it if it's not created by the current user
            if (theme.user_id !== currentUserId) {
              console.log(`Filtering out unwanted theme by name: ${theme.name} (ID: ${theme.id})`);
              return false;
            }
          }
          
          return true;
        });
        
        console.log(`Filtered themes from ${response.data.length} to ${filteredThemes.length}`);
        
        // Create a map to store unique themes by name (to handle any remaining duplicates)
        const themeMap = new Map<string, CustomTheme>();
        
        // First pass: add all themes to the map, prioritizing the current user's themes
        filteredThemes.forEach((theme: CustomTheme) => {
          const existingTheme = themeMap.get(theme.name);
          
          // If the theme doesn't exist in the map yet, or if this one belongs to the current user, add it
          if (!existingTheme || theme.user_id === currentUserId) {
            themeMap.set(theme.name, theme);
          } else if (existingTheme && new Date(theme.created_at || 0) > new Date(existingTheme.created_at || 0)) {
            // If neither belongs to the current user, keep the most recent one
            themeMap.set(theme.name, theme);
          }
        });
        
        // Convert map back to array
        const uniqueThemes = Array.from(themeMap.values());
        console.log(`Final filtered public themes: ${uniqueThemes.length}`);
        
        setPublicCustomThemes(uniqueThemes);
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
  
  // Add a listener to detect when the user logs in
  useEffect(() => {
    // Keep track of previous token and theme refresh time
    let prevToken = localStorage.getItem('token');
    let lastRefreshTime = 0;
    const MIN_REFRESH_INTERVAL = 60000; // 60 seconds minimum between refreshes
    let shouldAutoRefresh = true;
    
    // Create a function to check for authentication changes
    const checkAuthChanges = () => {
      // Don't auto-refresh if user is on the themes page (to avoid constant refreshing)
      const currentPath = window.location.pathname;
      if (currentPath.includes('/themes')) {
        shouldAutoRefresh = false;
        return;
      } else {
        shouldAutoRefresh = true;
      }
      
      const token = localStorage.getItem('token');
      const currentTime = Date.now();
      
      // Only refresh if token changed from null to a value
      // or if enough time has passed since last refresh
      if (shouldAutoRefresh && 
          ((token && !prevToken) || 
          (token && (currentTime - lastRefreshTime > MIN_REFRESH_INTERVAL)))) {
        console.log('User authentication detected or refresh interval passed, refreshing themes');
        fetchAllThemes();
        lastRefreshTime = currentTime;
      }
      
      // Update previous token
      prevToken = token;
    };
    
    // Check immediately
    checkAuthChanges();
    
    // Set up an interval to check for auth changes
    const authCheckInterval = setInterval(checkAuthChanges, 5000); // Check every 5 seconds
    
    // Add a direct event listener for storage changes (for when token is added in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && e.newValue && !prevToken) {
        console.log('Token added to localStorage, refreshing themes');
        fetchAllThemes();
        prevToken = e.newValue;
        lastRefreshTime = Date.now();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up interval and event listener on unmount
    return () => {
      clearInterval(authCheckInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Add a specific listener for login events
  useEffect(() => {
    // Function to check for token after login attempts
    const checkForTokenAfterLogin = () => {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Token found after login, fetching themes immediately');
        fetchAllThemes();
      }
    };
    
    // Listen for successful login events
    const handleLoginSuccess = () => {
      console.log('Login success event detected');
      // Wait a short time for token to be stored
      setTimeout(checkForTokenAfterLogin, 500);
    };
    
    // Create a custom event for login success
    window.addEventListener('vf-login-success', handleLoginSuccess);
    
    return () => {
      window.removeEventListener('vf-login-success', handleLoginSuccess);
    };
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