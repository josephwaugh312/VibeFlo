import axios, { AxiosInstance } from 'axios';
import { Track } from '../components/music/MusicPlayer';

// Create the API service with token management and interceptors
const apiService = (() => {
  // Create the base axios instance
  const api: AxiosInstance = axios.create({
    baseURL: 'http://localhost:5001/api',
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
      // Only clear token for non-auth and non-pomodoro endpoints
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      const isPomodoroEndpoint = error.config?.url?.includes('/pomodoro/');
      
      // Don't clear tokens for pomodoro endpoints - prevents logout when refreshing stats
      if (error.response?.status === 401 && !isAuthEndpoint && !isPomodoroEndpoint) {
        console.error('Unauthorized request - clearing auth state');
        localStorage.removeItem('token');
      } else if (error.response?.status === 401) {
        // For pomodoro endpoints, just log the error without clearing token
        console.log('401 received but not clearing token (auth or pomodoro endpoint)');
      }
      
      return Promise.reject(error);
    }
  );

  // Token management
  const setToken = (token: string | null) => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  };

  // Initialize with token from storage if present
  const token = localStorage.getItem('token');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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
      const response = await api.put('/auth/profile', userData);
      return response.data;
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
        const numericId = parseInt(id);
        if (isNaN(numericId)) {
          throw new Error('Invalid playlist ID');
        }
        
        const response = await api.get(`/playlists/${numericId}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching playlist:', error);
        throw error;
      }
    },

    createPlaylist: async (name: string, tracks: Track[] = []) => {
      try {
        const response = await api.post('/playlists', { 
          name, 
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
        const numericId = parseInt(id);
        if (isNaN(numericId)) {
          throw new Error('Invalid playlist ID');
        }
        
        const response = await api.put(`/playlists/${numericId}`, data);
        return response.data;
      } catch (error) {
        console.error('Error updating playlist:', error);
        throw error;
      }
    },
    
    deletePlaylist: async (id: string) => {
      try {
        const numericId = parseInt(id);
        if (isNaN(numericId)) {
          throw new Error('Invalid playlist ID');
        }
        
        const response = await api.delete(`/playlists/${numericId}`);
        return response.data;
      } catch (error) {
        console.error('Error deleting playlist:', error);
        throw error;
      }
    },

    addTrackToPlaylist: async (playlistId: string, track: Track) => {
      try {
        const numericId = parseInt(playlistId);
        if (isNaN(numericId)) {
          throw new Error('Invalid playlist ID');
        }
        
        const response = await api.post(`/playlists/${numericId}/tracks`, {
          track: {
            id: track.id,
            title: track.title,
            artist: track.artist,
            url: track.url,
            artwork: track.artwork || '',
            duration: track.duration || 0,
            source: track.source
          }
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
      return response.data;
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
      return response.data;
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