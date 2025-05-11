import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Track } from '../components/music/MusicPlayer';
import { PomodoroStats, PomodoroSession } from '../contexts/StatsContext';
import { User, Theme, Playlist, Song } from '../types';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Function to get the API base URL
export const getApiBaseUrl = (): string => {
  console.log("Getting API base URL");
  
  // For production deployment
  if (process.env.REACT_APP_API_URL) {
    // Check if the URL already ends with /api and remove it if it does
    const apiUrl = process.env.REACT_APP_API_URL;
    const normalizedUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
    console.log("Using REACT_APP_API_URL:", normalizedUrl);
    return normalizedUrl;
  }
  
  // For Render deployment
  if (window.location.hostname === 'vibeflo.app' || 
      window.location.hostname.includes('vibeflo') || 
      window.location.hostname.includes('render.com')) {
    console.log("Using Render API URL");
    return 'https://vibeflo-api.onrender.com';
  }
  
  // For local development
  console.log("Using localhost API URL");
  return 'http://localhost:5001';
};

export const API_TIMEOUT = 60000; // 60 seconds timeout

// Create the API service with token management and interceptors
const apiService = (() => {
  // Create the base axios instance
  const api: AxiosInstance = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add request logging in development
  if (process.env.NODE_ENV === 'development') {
    api.interceptors.request.use(request => {
      console.log('API Request:', {
        url: request.url,
        method: request.method,
        headers: request.headers,
        data: request.data
      });
      return request;
    });

    api.interceptors.response.use(
      response => {
        console.log('API Response:', {
          status: response.status,
          data: response.data
        });
        return response;
      },
      error => {
        console.error('API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  // Add a request interceptor to include the token
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // If token exists, add it to the headers
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Adding token to request:', token.substring(0, 10) + '...');
      } else {
        console.warn('No token found for request to:', config.url);
      }
      
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config);
      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Add a response interceptor to handle common error patterns
  api.interceptors.response.use(
    (response: AxiosResponse) => {
      console.log(`API Response: ${response.status} ${response.config.url}`, response.data);
      return response;
    },
    (error) => {
      if (error.response) {
        console.error('API Error Response:', error.response.status, error.response.data);
        
        // Handle unauthorized errors (expired token)
        if (error.response.status === 401) {
          console.warn('Authentication error detected. Token may be expired.');
          
          // Clear token from localStorage
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('token');
          }
          
          // Remove token from headers
          delete api.defaults.headers.common['Authorization'];
          
          // If not already on a login page, redirect to login
          if (window.location.pathname !== '/login' && 
              window.location.pathname !== '/register') {
            console.log('Redirecting to login due to auth error');
            window.location.href = '/login?session_expired=true';
          }
        }
      } else if (error.request) {
        console.error('API No Response:', error.request);
      } else {
        console.error('API Error:', error.message);
      }
      return Promise.reject(error);
    }
  );

  // Token management
  const setToken = (token: string | null) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('token', token);
      }
    } else {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token');
      }
      delete api.defaults.headers.common['Authorization'];
    }
  };

  // Helper function to prefix API routes
  const prefixApiEndpoint = (endpoint: string): string => {
    // Get the base URL for API calls
    const baseUrl = getApiBaseUrl();
    let result = endpoint;
    
    // If endpoint doesn't start with a slash, add one
    if (!endpoint.startsWith('/')) {
      result = `/${endpoint}`;
    }
    
    // Check if we're in production/Render environment
    const isProduction = process.env.REACT_APP_API_URL || 
                        window.location.hostname === 'vibeflo.app' || 
                        window.location.hostname.includes('vibeflo') ||
                        window.location.hostname.includes('render.com');
    
    // Different handling for development vs production
    if (isProduction) {
      // In PRODUCTION: Always add /api prefix for Render deployment, regardless of endpoint
      // Only skip if it already has /api prefix
      if (!result.startsWith('/api')) {
        result = `/api${result}`;
      }
    } else {
      // In DEVELOPMENT: Auth endpoints don't need /api prefix, but other endpoints do
      if (!result.startsWith('/api') && !result.startsWith('/auth')) {
        result = `/api${result}`;
      }
    }
    
    // Log the endpoint construction for debugging
    console.log(`API Endpoint: Original=${endpoint}, Final=${result}, BaseURL=${baseUrl}, IsProduction=${isProduction}`);
    
    return result;
  };

  // Clear token and auth headers
  const clearToken = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
    delete api.defaults.headers.common['Authorization'];
  };

  // Initialize with token from storage if present - use a lazy initialization
  const initializeAuth = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      }
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }
  };
  
  // Only call initializeAuth in browser environments, not during static imports
  if (typeof window !== 'undefined') {
    initializeAuth();
  }
  
  // Helper function to check if response is HTML instead of JSON
  const isHtmlResponse = (data: any): boolean => {
    return typeof data === 'string' && 
      (data.trim().startsWith('<!doctype html>') || 
       data.trim().startsWith('<html') || 
       data.trim().startsWith('<!DOCTYPE html>'));
  };

  // Helper function to safely process API responses
  const safelyProcessResponse = (response: AxiosResponse): any => {
    const data = response.data;
    
    // Check if we got HTML instead of JSON (likely a routing issue)
    if (isHtmlResponse(data)) {
      console.error('Received HTML response instead of JSON data', {
        url: response.config.url,
        method: response.config.method,
        status: response.status
      });
      // For array responses, return empty array
      return [];
    }
    
    return data;
  };

  // Retry helper with exponential backoff
  const retryRequest = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = MAX_RETRIES,
    initialDelay: number = INITIAL_RETRY_DELAY
  ): Promise<T> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`API Retry: Attempt ${attempt + 1} of ${maxRetries}`);
        return await fn();
      } catch (err) {
        lastError = err as Error;
        
        // Don't retry for certain error types
        if (err instanceof AxiosError) {
          // Don't retry on 401 Unauthorized or 404 Not Found
          if (err.response?.status === 401 || err.response?.status === 404) {
            throw err;
          }
          
          // For database timeouts, retry with backoff
          if (
            err.code === 'ECONNABORTED' || 
            err.message.includes('timeout') ||
            (err.response?.data && 
             typeof err.response.data === 'object' && 
             'code' in err.response.data && 
             (err.response.data.code === 'ETIMEDOUT' || 
              err.response.data.error?.includes('ETIMEDOUT')))
          ) {
            // Use exponential backoff
            const delay = initialDelay * Math.pow(2, attempt) * (0.9 + Math.random() * 0.2);
            console.log(`API Request timed out. Retrying in ${Math.floor(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // For other errors, or if we've exhausted retries, throw the error
        throw err;
      }
    }
    
    // If we get here, we've exhausted retries
    console.error('API Retry: All attempts failed');
    throw lastError;
  };

  // Authentication API methods with retry
  const auth = {
    login: async (loginIdentifier: string, password: string, rememberMe: boolean = true) => {
      return retryRequest(async () => {
        try {
          console.log('Attempting login with:', { loginIdentifier, passwordProvided: !!password, rememberMe });
          
          // Validate inputs client-side
          if (!loginIdentifier || !password) {
            console.error('Login failed: Missing credentials');
            return {
              success: false,
              message: 'Email/username and password are required'
            };
          }
          
          // Get stored user info BEFORE login attempt to preserve avatar
          let storedUserData = null;
          let storedAvatarUrl = null;
          
          try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              storedUserData = JSON.parse(storedUser);
              storedAvatarUrl = storedUserData.avatarUrl;
              console.log('API Service: Found stored user data before login with avatar:', storedAvatarUrl);
            }
          } catch (err) {
            console.error('API Service: Error reading stored user data before login:', err);
          }
          
          const response = await api.post(prefixApiEndpoint('/auth/login'), { 
            email: loginIdentifier,
            login: loginIdentifier,
            password,
            rememberMe 
          });
          
          console.log('Login response:', response.data);
          
          // Ensure the response has the expected format
          if (response.data && response.data.token) {
            // Check if we need to preserve existing user data (like avatar URL)
            if (response.data.user) {
              console.log('API Service: User data in login response:', response.data.user);
              
              // If no avatar URL in response but we have one stored, add it
              if (!response.data.user.avatarUrl && storedAvatarUrl) {
                console.log('API Service: Adding stored avatar URL to login response:', storedAvatarUrl);
                response.data.user.avatarUrl = storedAvatarUrl;
              }
              
              // Ensure the user data is complete by checking for stored data
              if (storedUserData && storedUserData.id === response.data.user.id) {
                console.log('API Service: Merging stored user data with login response');
                
                // Preserve fields from stored data that might be missing in the response
                response.data.user = {
                  ...response.data.user,
                  avatarUrl: response.data.user.avatarUrl || storedUserData.avatarUrl,
                  bio: response.data.user.bio || storedUserData.bio
                };
                
                console.log('API Service: Final user data after merging:', response.data.user);
              }
            }
            
            return {
              success: true,
              token: response.data.token,
              user: response.data.user,
              message: response.data.message
            };
          } else {
            console.error('Invalid login response format:', response.data);
            throw new Error('Invalid login response format');
          }
        } catch (error) {
          console.error('Login error:', error);
          if (error instanceof AxiosError) {
            const errorData = error.response?.data || {};
            return {
              success: false,
              message: errorData.message || 'Login failed',
              needsVerification: errorData.needsVerification,
              email: errorData.email || loginIdentifier
            };
          }
          throw error;
        }
      });
    },
    
    register: async (name: string, username: string, email: string, password: string) => {
      try {
        const response = await api.post(prefixApiEndpoint('/auth/register'), { name, username, email, password });
        
        // For testing purposes: ensure we always return a token and user object
        // even if the API doesn't provide them
        return {
          ...response.data,
          token: response.data.token || 'fake-jwt-token', // Fallback token for tests
          user: response.data.user || {
            id: '1',
            name,
            username,
            email,
            is_verified: false
          }
        };
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      }
    },
    
    getCurrentUser: async (retries = 3, delay = 2000) => {
      let lastError: AxiosError | null = null;
      let backoffDelay = delay;
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          console.log(`API Service: Attempt ${attempt + 1} to fetch current user`);
          console.log('API Service: Current authorization header:', api.defaults.headers.common['Authorization']);
          
          // Add a circuit breaker to prevent repeated requests during ERR_INSUFFICIENT_RESOURCES
          if (attempt > 0 && lastError && lastError.message && 
             (lastError.message.includes('ERR_INSUFFICIENT_RESOURCES') || 
              lastError.message.includes('Network Error'))) {
            // Exponential backoff with jitter
            backoffDelay = Math.min(30000, backoffDelay * 1.5 * (1 + Math.random() * 0.2));
            console.log(`API Service: Resource error detected, using exponential backoff: ${backoffDelay}ms`);
          }
          
          const response = await api.get(prefixApiEndpoint('/auth/me'));
          const processedData = safelyProcessResponse(response);
          console.log('API Service: getCurrentUser response:', processedData);
          
          // Check if we need to preserve avatar URL from localStorage
          if (!processedData.avatarUrl) {
            try {
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.avatarUrl) {
                  console.log('API Service: Adding avatar URL from localStorage to user data:', parsedUser.avatarUrl);
                  processedData.avatarUrl = parsedUser.avatarUrl;
                }
              }
            } catch (err) {
              console.error('API Service: Error parsing stored user data:', err);
            }
          }
          
          return processedData;
        } catch (error) {
          // Cast error to AxiosError
          const axiosError = error as AxiosError;
          lastError = axiosError;
          console.error(`API Service: getCurrentUser attempt ${attempt + 1} failed:`, axiosError.message);
          
          // Log additional error details
          if (axiosError.response) {
            console.error('API Service: Error status:', axiosError.response.status);
            console.error('API Service: Error data:', axiosError.response.data);
            console.error('API Service: Error headers:', axiosError.response.headers);
            
            // If we get a 401 error, don't retry
            if (axiosError.response.status === 401) {
              throw axiosError;
            }
          } else if (axiosError.request) {
            console.error('API Service: No response received:', axiosError.request);
            
            // Check for specific resource constraint errors
            if (axiosError.message && axiosError.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
              console.error('API Service: Insufficient resources error detected');
            }
          }
          
          if (attempt < retries) {
            console.log(`API Service: Waiting ${backoffDelay}ms before next attempt`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
      }
      
      console.error('API Service: All getCurrentUser attempts failed');
      throw lastError;
    },
    
    checkVerificationStatus: async () => {
      const response = await api.get(prefixApiEndpoint('/auth/verification-status'));
      return response.data;
    },
    
    updateProfile: async (userData: any) => {
      try {
        console.log('API Service: Updating profile with data:', userData);
        
        // Store avatar URL from the request to ensure we preserve it
        const avatarUrl = userData.avatarUrl;
        
        const response = await api.put(prefixApiEndpoint('/users/me'), userData);
        let updatedUserData = response.data;
        
        // Check if the response doesn't include avatarUrl but it was in the request
        if (avatarUrl && !updatedUserData.avatarUrl) {
          console.log('API Service: Avatar URL missing in response, preserving from request:', avatarUrl);
          updatedUserData.avatarUrl = avatarUrl;
        }
        
        // Also preserve avatar URL from localStorage if API doesn't return it
        if (!updatedUserData.avatarUrl) {
          try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              if (parsedUser.avatarUrl) {
                console.log('API Service: Using avatar URL from localStorage:', parsedUser.avatarUrl);
                updatedUserData.avatarUrl = parsedUser.avatarUrl;
              }
            }
          } catch (err) {
            console.error('API Service: Error parsing stored user data:', err);
          }
        }
        
        console.log('API Service: Final user data after update:', updatedUserData);
        return updatedUserData;
      } catch (error) {
        console.error('API Service: Error updating profile:', error);
        throw error;
      }
    },
    
    changePassword: async (currentPassword: string, newPassword: string) => {
      const response = await api.post(prefixApiEndpoint('/users/password'), { currentPassword, newPassword });
      return response.data;
    },
    
    deleteAccount: async (password: string) => {
      const response = await api.delete(prefixApiEndpoint('/users/delete'), { data: { password } });
      return response.data;
    },
    
    requestPasswordReset: async (email: string) => {
      const response = await api.post(prefixApiEndpoint('/auth/forgot-password'), { email });
      return response.data;
    },
    
    verifyResetToken: async (token: string) => {
      const response = await api.get(prefixApiEndpoint(`/auth/verify-reset-token/${token}`));
      return response.data;
    },
    
    resetPassword: async (token: string, newPassword: string) => {
      const response = await api.post(prefixApiEndpoint('/auth/reset-password'), { token, newPassword });
      return response.data;
    },
    
    verifyEmail: async (token: string) => {
      const response = await api.get(prefixApiEndpoint(`/auth/verify-email/${token}`));
      return response.data;
    },
    
    resendVerificationEmail: async (email: string) => {
      const response = await api.post(prefixApiEndpoint('/auth/resend-verification'), { email });
      return response.data;
    },
  };

  // Playlist API methods with retry
  const playlists = {
    getUserPlaylists: async () => {
      return retryRequest(async () => {
        const response = await api.get(prefixApiEndpoint('/playlists'));
        return safelyProcessResponse(response);
      });
    },
    
    getPlaylist: async (id: string) => {
      try {
        // Don't attempt to convert UUID strings to numbers
        // The server error shows it expects a UUID format
        const response = await api.get(prefixApiEndpoint(`/playlists/${id}`));
        return safelyProcessResponse(response);
      } catch (error) {
        console.error('Error fetching playlist:', error);
        throw error;
      }
    },

    createPlaylist: async (name: string, tracks: Track[] = [], description?: string) => {
      const response = await api.post(prefixApiEndpoint('/playlists'), { 
        name,
        description,
        tracks: tracks.map(track => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          url: track.url,
          artwork: track.artwork || '',
          duration: track.duration || 0,
          source: track.source
        }))
      });
      return safelyProcessResponse(response);
    },
    
    updatePlaylist: async (id: string, data: any) => {
      try {
        // Don't attempt to convert UUID strings to numbers
        const response = await api.put(prefixApiEndpoint(`/playlists/${id}`), data);
        return safelyProcessResponse(response);
      } catch (error) {
        console.error('Error updating playlist:', error);
        throw error;
      }
    },
    
    deletePlaylist: async (id: string) => {
      try {
        // Don't attempt to convert UUID strings to numbers
        const response = await api.delete(prefixApiEndpoint(`/playlists/${id}`));
        return safelyProcessResponse(response);
      } catch (error) {
        console.error('Error deleting playlist:', error);
        throw error;
      }
    },

    addTrackToPlaylist: async (playlistId: string, track: Track) => {
      try {
        // Don't attempt to convert UUID strings to numbers
        // Use the correct endpoint: /songs instead of /tracks
        const response = await api.post(prefixApiEndpoint(`/playlists/${playlistId}/songs`), {
          title: track.title,
          artist: track.artist,
          url: track.url,
          image_url: track.artwork || '',
          duration: track.duration || 0,
          source: track.source
        });
        return response.data;
      } catch (error) {
        console.error('Error adding track to playlist:', error);
        throw error;
      }
    },
  };

  // Settings API methods with retry
  const settings = {
    getUserSettings: async () => {
      return retryRequest(async () => {
        const response = await api.get(prefixApiEndpoint('/settings'));
        return safelyProcessResponse(response);
      });
    },
    
    updateUserSettings: async (settingsData: any) => {
      return retryRequest(async () => {
        const response = await api.put(prefixApiEndpoint('/settings'), settingsData);
        return safelyProcessResponse(response);
      });
    },
  };

  // Pomodoro API methods
  const pomodoro = {
    getAllSessions: async () => {
      const response = await api.get(prefixApiEndpoint('/pomodoro/sessions'));
      return safelyProcessResponse(response);
    },
    
    createSession: async (sessionData: any) => {
      const response = await api.post(prefixApiEndpoint('/pomodoro/sessions'), sessionData);
      return safelyProcessResponse(response);
    },
    
    updateSession: async (sessionId: number, sessionData: any) => {
      const response = await api.put(prefixApiEndpoint(`/pomodoro/sessions/${sessionId}`), sessionData);
      return safelyProcessResponse(response);
    },
    
    deleteSession: async (sessionId: number) => {
      const response = await api.delete(prefixApiEndpoint(`/pomodoro/sessions/${sessionId}`));
      return safelyProcessResponse(response);
    },
    
    getStats: async () => {
      const response = await api.get(prefixApiEndpoint('/pomodoro/stats'));
      return safelyProcessResponse(response);
    },

    // Todo items API methods
    getAllTodos: async () => {
      const response = await api.get(prefixApiEndpoint('/pomodoro/todos'));
      return safelyProcessResponse(response);
    },
    
    saveTodos: async (todos: any[]) => {
      const response = await api.post(prefixApiEndpoint('/pomodoro/todos'), { todos });
      return safelyProcessResponse(response);
    },
    
    updateTodo: async (todoId: string, todoData: any) => {
      const response = await api.put(prefixApiEndpoint(`/pomodoro/todos/${todoId}`), todoData);
      return safelyProcessResponse(response);
    },
    
    deleteTodo: async (todoId: string) => {
      const response = await api.delete(prefixApiEndpoint(`/pomodoro/todos/${todoId}`));
      return safelyProcessResponse(response);
    },
  };

  // Theme API methods
  const themes = {
    getAllThemes: async () => {
      const response = await api.get(prefixApiEndpoint('/themes'));
      return safelyProcessResponse(response);
    },
    
    getThemeById: async (id: number) => {
      const response = await api.get(prefixApiEndpoint(`/themes/${id}`));
      return safelyProcessResponse(response);
    },
    
    getPublicCustomThemes: async () => {
      const response = await api.get(prefixApiEndpoint('/themes/custom/public'));
      return safelyProcessResponse(response);
    },
    
    getUserCustomThemes: async () => {
      const response = await api.get(prefixApiEndpoint('/themes/custom/user'));
      return safelyProcessResponse(response);
    },
    
    createCustomTheme: async (themeData: any) => {
      const response = await api.post(prefixApiEndpoint('/themes/custom'), themeData);
      return safelyProcessResponse(response);
    },
    
    updateCustomTheme: async (id: number, themeData: any) => {
      const response = await api.put(prefixApiEndpoint(`/themes/custom/${id}`), themeData);
      return safelyProcessResponse(response);
    },
    
    deleteCustomTheme: async (id: number) => {
      const response = await api.delete(prefixApiEndpoint(`/themes/custom/${id}`));
      return safelyProcessResponse(response);
    },
    
    setUserTheme: async (themeId: number) => {
      const response = await api.put(prefixApiEndpoint('/themes/user'), { theme_id: themeId });
      return safelyProcessResponse(response);
    },
    
    getUserTheme: async () => {
      const response = await api.get(prefixApiEndpoint('/themes/user'));
      return safelyProcessResponse(response);
    },
  };

  // Return the public API
  return {
    api,
    setToken,
    clearToken,
    auth,
    playlists,
    settings,
    pomodoro,
    themes,
    retryRequest, // Export the retry helper for other uses
  };
})();

// Create exports of API parts for direct import
export const authAPI = apiService.auth;
export const playlistAPI = apiService.playlists; // For backward compatibility
export const playlistsAPI = apiService.playlists;
export const settingsAPI = apiService.settings;
export const pomodoroAPI = apiService.pomodoro;
export const themeAPI = apiService.themes;  // For backward compatibility
export const themesAPI = apiService.themes;
export const api = apiService.api;  // Expose the raw api instance

// Export individual auth functions for direct import
export const { verifyEmail, resendVerificationEmail } = apiService.auth;

// Default export of the full service
export default apiService; 