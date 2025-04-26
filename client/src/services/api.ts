import axios, { AxiosInstance } from 'axios';
import { Track } from '../components/music/MusicPlayer';
import { PomodoroStats, PomodoroSession } from '../contexts/StatsContext';

// Function to get the API base URL
export const getApiBaseUrl = (): string => {
  console.log("Getting API base URL");
  
  // For production deployment
  if (process.env.REACT_APP_API_URL) {
    console.log("Using REACT_APP_API_URL:", process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // For Render deployment
  if (window.location.hostname === 'vibeflo.app' || 
      window.location.hostname.includes('vibeflo') || 
      window.location.hostname.includes('render.com')) {
    console.log("Using Render API URL");
    return 'https://vibeflo-api.onrender.com/api';
  }
  
  // For local development
  console.log("Using localhost API URL");
  return 'http://localhost:5001/api';
};

// Create the API service with token management and interceptors
const apiService = (() => {
  // Create the base axios instance
  const api: AxiosInstance = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 10000,
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
    (config) => {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // If token exists, add it to the headers
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add a response interceptor to handle common error patterns
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // Log the error but don't clear auth token automatically
      if (error.response?.status === 401) {
        console.warn(`401 Unauthorized received from ${error.config?.url} - auth handling delegated to context`);
        
        // Don't clear token here - let the Auth context handle it based on the actual error message
        // This prevents unwanted logouts during temporary server issues
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
  
  // Authentication API methods
  const auth = {
    login: async (loginIdentifier: string, password: string) => {
      const response = await api.post('/auth/login', { login: loginIdentifier, password });
      return response.data;
    },
    
    register: async (name: string, username: string, email: string, password: string) => {
      const response = await api.post('/auth/register', { name, username, email, password });
      return response.data;
    },
    
    getCurrentUser: async () => {
      const response = await api.get('/auth/me');
      return response.data;
    },
    
    updateProfile: async (userData: any) => {
      try {
        console.log('API service - updateProfile raw data:', userData);
        const response = await api.put('/users/me', userData);
        console.log('API service - updateProfile raw response:', response);
        
        // Make sure avatar changes are preserved
        if (userData.avatarUrl && !response.data.avatarUrl) {
          console.warn('API response missing avatarUrl! Adding back from request data.');
          response.data.avatarUrl = userData.avatarUrl;
        }
        
        return response.data;
      } catch (error) {
        console.error('Failed to update profile:', error);
        throw error;
      }
    },
    
    changePassword: async (currentPassword: string, newPassword: string) => {
      try {
        const response = await api.post('/users/password', { currentPassword, newPassword });
        return response.data;
      } catch (error) {
        console.error('Failed to change password:', error);
        throw error;
      }
    },
    
    deleteAccount: async (password: string) => {
      try {
        const response = await api.delete('/users/delete', { 
          data: { password } 
        });
        return response.data;
      } catch (error) {
        console.error('Failed to delete account:', error);
        throw error;
      }
    },
    
    requestPasswordReset: async (email: string) => {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    },
    
    verifyResetToken: async (token: string) => {
      const response = await api.get(`/auth/verify-reset-token/${token}`);
      return response.data;
    },
    
    resetPassword: async (token: string, newPassword: string) => {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      return response.data;
    },
  };

  // Playlist API methods
  const playlists = {
    getUserPlaylists: async () => {
      try {
        console.log('Fetching user playlists...');
        const response = await api.get('/playlists');
        console.log('User playlists response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching user playlists:', error);
        throw error;
      }
    },
    
    getPlaylist: async (id: string) => {
      try {
        // Don't attempt to convert UUID strings to numbers
        // The server error shows it expects a UUID format
        const response = await api.get(`/playlists/${id}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching playlist:', error);
        throw error;
      }
    },

    createPlaylist: async (name: string, tracks: Track[] = [], description?: string) => {
      try {
        const response = await api.post('/playlists', { 
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
        return response.data;
      } catch (error) {
        console.error('Error creating playlist:', error);
        throw error;
      }
    },
    
    updatePlaylist: async (id: string, data: any) => {
      try {
        // Don't attempt to convert UUID strings to numbers
        const response = await api.put(`/playlists/${id}`, data);
        return response.data;
      } catch (error) {
        console.error('Error updating playlist:', error);
        throw error;
      }
    },
    
    deletePlaylist: async (id: string) => {
      try {
        // Don't attempt to convert UUID strings to numbers
        const response = await api.delete(`/playlists/${id}`);
        return response.data;
      } catch (error) {
        console.error('Error deleting playlist:', error);
        throw error;
      }
    },

    addTrackToPlaylist: async (playlistId: string, track: Track) => {
      try {
        // Don't attempt to convert UUID strings to numbers
        // Use the correct endpoint: /songs instead of /tracks
        const response = await api.post(`/playlists/${playlistId}/songs`, {
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

  // Settings API methods
  const settings = {
    getUserSettings: async () => {
      const response = await api.get('/settings');
      return response.data;
    },
    
    updateUserSettings: async (settingsData: any) => {
      const response = await api.put('/settings', settingsData);
      return response.data;
    },
  };

  // Pomodoro API methods
  const pomodoro = {
    getAllSessions: async () => {
      const response = await api.get('/pomodoro/sessions');
      return response.data as PomodoroSession[];
    },
    
    createSession: async (sessionData: any) => {
      const response = await api.post('/pomodoro/sessions', sessionData);
      return response.data;
    },
    
    updateSession: async (sessionId: number, sessionData: any) => {
      const response = await api.put(`/pomodoro/sessions/${sessionId}`, sessionData);
      return response.data;
    },
    
    deleteSession: async (sessionId: number) => {
      const response = await api.delete(`/pomodoro/sessions/${sessionId}`);
      return response.data;
    },
    
    getStats: async () => {
      const response = await api.get('/pomodoro/stats');
      return response.data as PomodoroStats;
    },

    // Todo items API methods
    getAllTodos: async () => {
      const response = await api.get('/pomodoro/todos');
      return response.data;
    },
    
    saveTodos: async (todos: any[]) => {
      const response = await api.post('/pomodoro/todos', { todos });
      return response.data;
    },
    
    updateTodo: async (todoId: string, todoData: any) => {
      const response = await api.put(`/pomodoro/todos/${todoId}`, todoData);
      return response.data;
    },
    
    deleteTodo: async (todoId: string) => {
      const response = await api.delete(`/pomodoro/todos/${todoId}`);
      return response.data;
    },
  };

  // Theme API methods
  const themes = {
    getAllThemes: async () => {
      const response = await api.get('/themes');
      return response.data;
    },
    
    getThemeById: async (id: number) => {
      const response = await api.get(`/themes/${id}`);
      return response.data;
    },
    
    getPublicCustomThemes: async () => {
      const response = await api.get('/themes/custom/public');
      return response.data;
    },
    
    getUserCustomThemes: async () => {
      const response = await api.get('/themes/custom/user');
      return response.data;
    },
    
    createCustomTheme: async (themeData: any) => {
      const response = await api.post('/themes/custom', themeData);
      return response.data;
    },
    
    updateCustomTheme: async (id: number, themeData: any) => {
      const response = await api.put(`/themes/custom/${id}`, themeData);
      return response.data;
    },
    
    deleteCustomTheme: async (id: number) => {
      const response = await api.delete(`/themes/custom/${id}`);
      return response.data;
    },
    
    setUserTheme: async (themeId: number) => {
      const response = await api.put('/themes/user', { theme_id: themeId });
      return response.data;
    },
    
    getUserTheme: async () => {
      const response = await api.get('/themes/user');
      return response.data;
    },
  };

  // Return the public API
  return {
    api,
    setToken,
    auth,
    playlists,
    settings,
    pomodoro,
    themes,
  };
})();

// Export individual APIs
export const authAPI = apiService.auth;
export const playlistAPI = apiService.playlists;
export const settingsAPI = apiService.settings;
export const pomodoroAPI = apiService.pomodoro;
export const themeAPI = apiService.themes;
export const api = apiService.api;

export default apiService; 