// Mock API Service
import { Track } from '../components/music/MusicPlayer';

// Create the API mock instance
const mockAxiosInstance = {
  get: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  put: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} }),
  defaults: { 
    headers: { 
      common: {} as Record<string, string> 
    } 
  },
  interceptors: {
    request: { 
      use: jest.fn(),
      eject: jest.fn() 
    },
    response: { 
      use: jest.fn(),
      eject: jest.fn() 
    }
  }
};

// Token management
const mockStorage: Record<string, string> = {};

const setToken = (token: string | null) => {
  if (token) {
    mockAxiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    mockStorage['token'] = token;
  } else {
    delete mockAxiosInstance.defaults.headers.common['Authorization'];
    delete mockStorage['token'];
  }
};

// Authentication API methods
const auth = {
  login: jest.fn().mockResolvedValue({ token: 'mock-token', user: { id: 1 } }),
  register: jest.fn().mockResolvedValue({ token: 'mock-token', user: { id: 1 } }),
  getCurrentUser: jest.fn().mockResolvedValue({ id: 1, username: 'testuser' }),
  updateProfile: jest.fn().mockResolvedValue({ id: 1, username: 'testuser' }),
  changePassword: jest.fn().mockResolvedValue({ success: true }),
  deleteAccount: jest.fn().mockResolvedValue({ success: true }),
  requestPasswordReset: jest.fn().mockResolvedValue({ success: true }),
  verifyResetToken: jest.fn().mockResolvedValue({ valid: true }),
  resetPassword: jest.fn().mockResolvedValue({ success: true }),
  setToken: jest.fn().mockImplementation((token: string) => {
    console.log('Mock setToken called with:', token);
    return { success: true };
  })
};

// Playlist API methods
const playlists = {
  getUserPlaylists: jest.fn().mockResolvedValue([{ id: 1, name: 'Test Playlist' }]),
  getPlaylist: jest.fn().mockImplementation((id: string) => {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return Promise.reject(new Error('Invalid playlist ID'));
    }
    return Promise.resolve({ id: numericId, name: 'Test Playlist', tracks: [] });
  }),
  createPlaylist: jest.fn().mockResolvedValue({ id: 1, name: 'New Playlist', tracks: [] }),
  updatePlaylist: jest.fn().mockResolvedValue({ id: 1, name: 'Updated Playlist' }),
  deletePlaylist: jest.fn().mockResolvedValue({ success: true }),
  addTrackToPlaylist: jest.fn().mockResolvedValue({ success: true, track: { id: '1', title: 'Test Track' } }),
};

// Settings API methods
const settings = {
  getUserSettings: jest.fn().mockResolvedValue({ theme: 'dark' }),
  updateUserSettings: jest.fn().mockResolvedValue({ theme: 'light' }),
};

// Pomodoro API methods
const pomodoro = {
  getAllSessions: jest.fn().mockResolvedValue([]),
  createSession: jest.fn().mockResolvedValue({ id: 1 }),
  updateSession: jest.fn().mockResolvedValue({ id: 1 }),
  deleteSession: jest.fn().mockResolvedValue({ success: true }),
  getStats: jest.fn().mockResolvedValue({}),
  getAllTodos: jest.fn().mockResolvedValue([]),
  saveTodos: jest.fn().mockResolvedValue([]),
  updateTodo: jest.fn().mockResolvedValue({}),
  deleteTodo: jest.fn().mockResolvedValue({ success: true }),
  recordSession: jest.fn().mockResolvedValue({ success: true, id: 1 })
};

// Theme API methods
const themes = {
  getAllThemes: jest.fn().mockResolvedValue([]),
  getThemeById: jest.fn().mockResolvedValue({}),
  getPublicCustomThemes: jest.fn().mockResolvedValue([]),
  getUserCustomThemes: jest.fn().mockResolvedValue([]),
  createCustomTheme: jest.fn().mockResolvedValue({}),
  updateCustomTheme: jest.fn().mockResolvedValue({}),
  deleteCustomTheme: jest.fn().mockResolvedValue({ success: true }),
  setUserTheme: jest.fn().mockResolvedValue({ success: true }),
  getUserTheme: jest.fn().mockResolvedValue({}),
};

// Return the mock API
const apiService = {
  api: mockAxiosInstance,
  setToken,
  auth,
  playlists,
  settings,
  pomodoro,
  themes,
};

// Export individual APIs
export const authAPI = apiService.auth;
export const playlistAPI = apiService.playlists;
export const settingsAPI = apiService.settings;
export const pomodoroAPI = apiService.pomodoro;
export const themeAPI = apiService.themes;
export const api = apiService.api;

export default apiService; 