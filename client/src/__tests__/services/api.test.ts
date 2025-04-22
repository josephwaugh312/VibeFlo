import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import apiService, { 
  playlistAPI, 
  authAPI, 
  settingsAPI, 
  pomodoroAPI, 
  themeAPI,
  api
} from '../../services/api';

// Create a mock for axios to intercept and mock API calls
const mockAxios = new MockAdapter(api);

// Create a mock localStorage
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: jest.fn((key: string) => mockStorage[key] || null),
  setItem: jest.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: jest.fn((key: string) => { delete mockStorage[key]; }),
  clear: jest.fn(() => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); })
};

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    mockAxios.reset();
    
    // Reset console mocks
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  describe('Token Management', () => {
    it('should set token in localStorage and axios headers', () => {
      apiService.setToken('test-token');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
      expect(api.defaults.headers.common['Authorization']).toBe('Bearer test-token');
    });
    
    it('should remove token when null is passed', () => {
      // First set a token
      apiService.setToken('test-token');
      
      // Then clear it
      apiService.setToken(null);
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });
  });
  
  describe('Auth API Methods', () => {
    it('should call login endpoint with the correct data', async () => {
      const mockResponse = { token: 'login-token', user: { id: 1, username: 'testuser' } };
      mockAxios.onPost('/auth/login').reply(200, mockResponse);
      
      const result = await authAPI.login('user@example.com', 'password');
      
      expect(mockAxios.history.post[0].url).toBe('/auth/login');
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual({
        login: 'user@example.com',
        password: 'password'
      });
      expect(result).toEqual(mockResponse);
    });
    
    it('should call register endpoint with the correct data', async () => {
      const mockResponse = { token: 'register-token', user: { id: 2, username: 'newuser' } };
      mockAxios.onPost('/auth/register').reply(200, mockResponse);
      
      const result = await authAPI.register('New User', 'newuser', 'new@example.com', 'newpassword');
      
      expect(mockAxios.history.post[0].url).toBe('/auth/register');
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual({
        name: 'New User',
        username: 'newuser',
        email: 'new@example.com',
        password: 'newpassword'
      });
      expect(result).toEqual(mockResponse);
    });

    it('should call getCurrentUser endpoint', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'user@example.com' };
      mockAxios.onGet('/auth/me').reply(200, mockUser);
      
      const result = await authAPI.getCurrentUser();
      
      expect(mockAxios.history.get[0].url).toBe('/auth/me');
      expect(result).toEqual(mockUser);
    });
    
    it('should call updateProfile with proper error handling', async () => {
      // Test the console logging
      const consoleErrorSpy = jest.spyOn(console, 'error');
      
      // Mock error response
      mockAxios.onPut('/users/me').reply(500, { message: 'Server error' });
      
      // Attempt to update profile and expect failure
      try {
        await authAPI.updateProfile({ username: 'testuser' });
        fail('Should have thrown an error');
      } catch (error) {
        // Verify error handling
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(mockAxios.history.put.length).toBe(1);
      }
    });

    it('should call changePassword with the correct data', async () => {
      mockAxios.onPost('/users/password').reply(200, { success: true });
      
      const result = await authAPI.changePassword('oldpass', 'newpass');
      
      expect(mockAxios.history.post[0].url).toBe('/users/password');
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual({
        currentPassword: 'oldpass',
        newPassword: 'newpass'
      });
      expect(result).toEqual({ success: true });
    });
    
    it('should handle errors in changePassword', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      
      mockAxios.onPost('/users/password').reply(400, { message: 'Current password is incorrect' });
      
      try {
        await authAPI.changePassword('wrongpass', 'newpass');
        fail('Should have thrown an error');
      } catch (error) {
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(mockAxios.history.post.length).toBe(1);
      }
    });
    
    it('should format deleteAccount request correctly', async () => {
      // Mock successful response
      mockAxios.onDelete('/users/delete').reply(200, { success: true });
      
      await authAPI.deleteAccount('password123');
      
      expect(mockAxios.history.delete.length).toBe(1);
      const requestData = JSON.parse(mockAxios.history.delete[0].data || '{}');
      expect(requestData).toEqual({ password: 'password123' });
    });

    it('should call requestPasswordReset with the correct data', async () => {
      mockAxios.onPost('/auth/forgot-password').reply(200, { 
        success: true, 
        message: 'Password reset email sent' 
      });
      
      const result = await authAPI.requestPasswordReset('user@example.com');
      
      expect(mockAxios.history.post[0].url).toBe('/auth/forgot-password');
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual({
        email: 'user@example.com'
      });
      expect(result).toEqual({ 
        success: true, 
        message: 'Password reset email sent' 
      });
    });
    
    it('should call verifyResetToken with the correct token', async () => {
      mockAxios.onGet('/auth/verify-reset-token/reset-token-123').reply(200, { 
        valid: true
      });
      
      const result = await authAPI.verifyResetToken('reset-token-123');
      
      expect(mockAxios.history.get[0].url).toBe('/auth/verify-reset-token/reset-token-123');
      expect(result).toEqual({ valid: true });
    });
    
    it('should call resetPassword with the correct data', async () => {
      mockAxios.onPost('/auth/reset-password').reply(200, { 
        success: true 
      });
      
      const result = await authAPI.resetPassword('reset-token-123', 'newpassword');
      
      expect(mockAxios.history.post[0].url).toBe('/auth/reset-password');
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual({
        token: 'reset-token-123',
        newPassword: 'newpassword'
      });
      expect(result).toEqual({ success: true });
    });
  });
  
  describe('Playlist API Methods', () => {
    it('should call getUserPlaylists with proper logging', async () => {
      // Spy on console.log
      const consoleLogSpy = jest.spyOn(console, 'log');
      
      const mockPlaylists = [
        { id: 1, name: 'Playlist 1', tracks: [] },
        { id: 2, name: 'Playlist 2', tracks: [] }
      ];
      
      mockAxios.onGet('/playlists').reply(200, mockPlaylists);
      
      const result = await playlistAPI.getUserPlaylists();
      
      expect(mockAxios.history.get[0].url).toBe('/playlists');
      expect(result).toEqual(mockPlaylists);
      expect(consoleLogSpy).toHaveBeenCalledWith('Fetching user playlists...');
    });
    
    it('should handle errors in getUserPlaylists', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      
      mockAxios.onGet('/playlists').reply(500, { message: 'Server error' });
      
      try {
        await playlistAPI.getUserPlaylists();
        fail('Should have thrown an error');
      } catch (error) {
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(mockAxios.history.get.length).toBe(1);
      }
    });
    
    it('should reject non-numeric IDs in getPlaylist', async () => {
      try {
        await playlistAPI.getPlaylist('abc');
        fail('Should have rejected non-numeric ID');
      } catch (error: any) {
        expect(error.message).toBe('Invalid playlist ID');
        expect(mockAxios.history.get.length).toBe(0); // No API call made
      }
    });
    
    it('should accept numeric ID strings in getPlaylist', async () => {
      mockAxios.onGet('/playlists/123').reply(200, {
        id: 123, 
        name: 'Test Playlist'
      });
      
      const result = await playlistAPI.getPlaylist('123');
      
      expect(result).toEqual({
        id: 123,
        name: 'Test Playlist'
      });
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toBe('/playlists/123');
    });
    
    it('should create a playlist with tracks in the correct format', async () => {
      mockAxios.onPost('/playlists').reply(config => {
        const data = JSON.parse(config.data);
        
        // Return the same data in the response
        return [200, { id: 1, ...data }];
      });
      
      const tracks = [{
        id: 'track1',
        title: 'Track Title',
        artist: 'Track Artist',
        url: 'http://example.com/track',
        artwork: 'http://example.com/artwork',
        duration: 180,
        source: 'youtube'
      }];
      
      const result = await playlistAPI.createPlaylist('New Playlist', tracks);
      
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toBe('/playlists');
      
      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.name).toBe('New Playlist');
      expect(requestData.tracks.length).toBe(1);
      expect(requestData.tracks[0]).toEqual({
        id: 'track1',
        title: 'Track Title',
        artist: 'Track Artist',
        url: 'http://example.com/track',
        artwork: 'http://example.com/artwork',
        duration: 180,
        source: 'youtube'
      });
    });
    
    it('should call updatePlaylist with the correct data', async () => {
      mockAxios.onPut('/playlists/456').reply(config => {
        const data = JSON.parse(config.data);
        return [200, { id: 456, ...data }];
      });
      
      const updateData = {
        name: 'Updated Playlist',
        description: 'Updated description'
      };
      
      const result = await playlistAPI.updatePlaylist('456', updateData);
      
      expect(mockAxios.history.put.length).toBe(1);
      expect(mockAxios.history.put[0].url).toBe('/playlists/456');
      expect(JSON.parse(mockAxios.history.put[0].data)).toEqual(updateData);
      expect(result).toEqual({ id: 456, ...updateData });
    });
    
    it('should reject non-numeric IDs in updatePlaylist', async () => {
      try {
        await playlistAPI.updatePlaylist('abc', { name: 'Updated' });
        fail('Should have rejected non-numeric ID');
      } catch (error: any) {
        expect(error.message).toBe('Invalid playlist ID');
        expect(mockAxios.history.put.length).toBe(0); // No API call made
      }
    });
    
    it('should call deletePlaylist with the correct ID', async () => {
      mockAxios.onDelete('/playlists/789').reply(200, { success: true });
      
      const result = await playlistAPI.deletePlaylist('789');
      
      expect(mockAxios.history.delete.length).toBe(1);
      expect(mockAxios.history.delete[0].url).toBe('/playlists/789');
      expect(result).toEqual({ success: true });
    });
    
    it('should reject non-numeric IDs in deletePlaylist', async () => {
      try {
        await playlistAPI.deletePlaylist('abc');
        fail('Should have rejected non-numeric ID');
      } catch (error: any) {
        expect(error.message).toBe('Invalid playlist ID');
        expect(mockAxios.history.delete.length).toBe(0); // No API call made
      }
    });
    
    it('should handle missing optional fields when adding a track', async () => {
      mockAxios.onPost('/playlists/456/tracks').reply(config => {
        const data = JSON.parse(config.data);
        return [200, { success: true, track: data.track }];
      });
      
      const incompleteTrack = {
        id: 'track2',
        title: 'Minimal Track',
        artist: 'Minimal Artist',
        url: 'http://example.com/minimal',
        source: 'youtube'
        // Missing artwork and duration
      };
      
      const result = await playlistAPI.addTrackToPlaylist('456', incompleteTrack as any);
      
      expect(mockAxios.history.post.length).toBe(1);
      const requestData = JSON.parse(mockAxios.history.post[0].data);
      
      // Verify defaults were applied
      expect(requestData.track.artwork).toBe('');
      expect(requestData.track.duration).toBe(0);
    });
    
    it('should log errors when adding a track fails', async () => {
      // Test the console logging
      const consoleErrorSpy = jest.spyOn(console, 'error');
      
      // Mock error response
      mockAxios.onPost('/playlists/789/tracks').reply(500, { message: 'Server error' });
      
      const track = {
        id: 'track3',
        title: 'Error Track',
        artist: 'Error Artist',
        url: 'http://example.com/error',
        artwork: '',
        duration: 0,
        source: 'youtube'
      };
      
      try {
        await playlistAPI.addTrackToPlaylist('789', track);
        fail('Should have thrown an error');
      } catch (error) {
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(mockAxios.history.post.length).toBe(1);
      }
    });
  });
  
  describe('Settings API Methods', () => {
    it('should call getUserSettings with the correct endpoint', async () => {
      const mockSettings = { 
        theme: 'dark',
        notifications: true
      };
      
      mockAxios.onGet('/settings').reply(200, mockSettings);
      
      const result = await settingsAPI.getUserSettings();
      
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toBe('/settings');
      expect(result).toEqual(mockSettings);
    });
    
    it('should call updateUserSettings with the correct data', async () => {
      const newSettings = {
        theme: 'light',
        notifications: false
      };
      
      mockAxios.onPut('/settings').reply(config => {
        const data = JSON.parse(config.data);
        return [200, { ...data, updated: true }];
      });
      
      const result = await settingsAPI.updateUserSettings(newSettings);
      
      expect(mockAxios.history.put.length).toBe(1);
      expect(mockAxios.history.put[0].url).toBe('/settings');
      expect(JSON.parse(mockAxios.history.put[0].data)).toEqual(newSettings);
      expect(result).toEqual({ ...newSettings, updated: true });
    });
  });
  
  describe('Pomodoro API Methods', () => {
    it('should call getAllSessions with the correct endpoint', async () => {
      const mockSessions = [
        { id: 1, duration: 25, completed: true },
        { id: 2, duration: 15, completed: false }
      ];
      
      mockAxios.onGet('/pomodoro/sessions').reply(200, mockSessions);
      
      const result = await pomodoroAPI.getAllSessions();
      
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toBe('/pomodoro/sessions');
      expect(result).toEqual(mockSessions);
    });
    
    it('should call createSession with the correct data', async () => {
      const sessionData = { 
        duration: 25, 
        type: 'focus',
        timestamp: '2023-01-01T12:00:00Z' 
      };
      
      mockAxios.onPost('/pomodoro/sessions').reply(config => {
        const data = JSON.parse(config.data);
        return [200, { id: 3, ...data }];
      });
      
      const result = await pomodoroAPI.createSession(sessionData);
      
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toBe('/pomodoro/sessions');
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual(sessionData);
      expect(result).toEqual({ id: 3, ...sessionData });
    });
    
    it('should call updateSession with the correct data', async () => {
      const sessionData = { 
        duration: 30,
        completed: true
      };
      
      mockAxios.onPut('/pomodoro/sessions/5').reply(config => {
        const data = JSON.parse(config.data);
        return [200, { id: 5, ...data }];
      });
      
      const result = await pomodoroAPI.updateSession(5, sessionData);
      
      expect(mockAxios.history.put.length).toBe(1);
      expect(mockAxios.history.put[0].url).toBe('/pomodoro/sessions/5');
      expect(JSON.parse(mockAxios.history.put[0].data)).toEqual(sessionData);
      expect(result).toEqual({ id: 5, ...sessionData });
    });
    
    it('should call deleteSession with the correct ID', async () => {
      mockAxios.onDelete('/pomodoro/sessions/7').reply(200, { success: true });
      
      const result = await pomodoroAPI.deleteSession(7);
      
      expect(mockAxios.history.delete.length).toBe(1);
      expect(mockAxios.history.delete[0].url).toBe('/pomodoro/sessions/7');
      expect(result).toEqual({ success: true });
    });
    
    it('should call getStats with the correct endpoint', async () => {
      const mockStats = {
        totalSessions: 10,
        focusTime: 250,
        avgSessionLength: 25
      };
      
      mockAxios.onGet('/pomodoro/stats').reply(200, mockStats);
      
      const result = await pomodoroAPI.getStats();
      
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toBe('/pomodoro/stats');
      expect(result).toEqual(mockStats);
    });
    
    it('should call saveTodos with the correct data format', async () => {
      const todos = [
        { id: 'todo1', text: 'Task 1', completed: false },
        { id: 'todo2', text: 'Task 2', completed: true }
      ];
      
      mockAxios.onPost('/pomodoro/todos').reply(config => {
        const data = JSON.parse(config.data);
        return [200, data.todos];
      });
      
      const result = await pomodoroAPI.saveTodos(todos);
      
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toBe('/pomodoro/todos');
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual({ todos });
      expect(result).toEqual(todos);
    });
  });
  
  describe('Theme API Methods', () => {
    it('should call getAllThemes with the correct endpoint', async () => {
      const mockThemes = [
        { id: 1, name: 'Default', colors: {} },
        { id: 2, name: 'Dark', colors: {} }
      ];
      
      mockAxios.onGet('/themes').reply(200, mockThemes);
      
      const result = await themeAPI.getAllThemes();
      
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toBe('/themes');
      expect(result).toEqual(mockThemes);
    });
    
    it('should call getThemeById with the correct ID', async () => {
      const mockTheme = {
        id: 3,
        name: 'Forest',
        colors: {
          primary: '#00FF00',
          secondary: '#005500'
        }
      };
      
      mockAxios.onGet('/themes/3').reply(200, mockTheme);
      
      const result = await themeAPI.getThemeById(3);
      
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toBe('/themes/3');
      expect(result).toEqual(mockTheme);
    });
    
    it('should call getPublicCustomThemes with the correct endpoint', async () => {
      const mockThemes = [
        { id: 4, name: 'Ocean', colors: {}, isPublic: true },
        { id: 5, name: 'Sunset', colors: {}, isPublic: true }
      ];
      
      mockAxios.onGet('/themes/custom/public').reply(200, mockThemes);
      
      const result = await themeAPI.getPublicCustomThemes();
      
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toBe('/themes/custom/public');
      expect(result).toEqual(mockThemes);
    });
    
    it('should call getUserCustomThemes with the correct endpoint', async () => {
      const mockThemes = [
        { id: 6, name: 'Personal', colors: {}, isPublic: false },
        { id: 7, name: 'Work', colors: {}, isPublic: false }
      ];
      
      mockAxios.onGet('/themes/custom/user').reply(200, mockThemes);
      
      const result = await themeAPI.getUserCustomThemes();
      
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toBe('/themes/custom/user');
      expect(result).toEqual(mockThemes);
    });
    
    it('should call createCustomTheme with the correct data', async () => {
      const themeData = {
        name: 'New Theme',
        colors: {
          primary: '#FF0000',
          secondary: '#0000FF'
        },
        isPublic: true
      };
      
      mockAxios.onPost('/themes/custom').reply(config => {
        const data = JSON.parse(config.data);
        return [200, { id: 8, ...data }];
      });
      
      const result = await themeAPI.createCustomTheme(themeData);
      
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toBe('/themes/custom');
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual(themeData);
      expect(result).toEqual({ id: 8, ...themeData });
    });
    
    it('should call updateCustomTheme with the correct data', async () => {
      const themeData = {
        name: 'Updated Theme',
        colors: {
          primary: '#00FF00'
        }
      };
      
      mockAxios.onPut('/themes/custom/9').reply(config => {
        const data = JSON.parse(config.data);
        return [200, { id: 9, ...data }];
      });
      
      const result = await themeAPI.updateCustomTheme(9, themeData);
      
      expect(mockAxios.history.put.length).toBe(1);
      expect(mockAxios.history.put[0].url).toBe('/themes/custom/9');
      expect(JSON.parse(mockAxios.history.put[0].data)).toEqual(themeData);
      expect(result).toEqual({ id: 9, ...themeData });
    });
    
    it('should call deleteCustomTheme with the correct ID', async () => {
      mockAxios.onDelete('/themes/custom/10').reply(200, { success: true });
      
      const result = await themeAPI.deleteCustomTheme(10);
      
      expect(mockAxios.history.delete.length).toBe(1);
      expect(mockAxios.history.delete[0].url).toBe('/themes/custom/10');
      expect(result).toEqual({ success: true });
    });
    
    it('should call setUserTheme with the correct format', async () => {
      mockAxios.onPut('/themes/user').reply(config => {
        const data = JSON.parse(config.data);
        return [200, { success: true, theme_id: data.theme_id }];
      });
      
      const result = await themeAPI.setUserTheme(5);
      
      expect(mockAxios.history.put.length).toBe(1);
      expect(mockAxios.history.put[0].url).toBe('/themes/user');
      expect(JSON.parse(mockAxios.history.put[0].data)).toEqual({ theme_id: 5 });
      expect(result).toEqual({ success: true, theme_id: 5 });
    });
    
    it('should call getUserTheme with the correct endpoint', async () => {
      const mockTheme = {
        id: 11,
        name: 'Current Theme',
        colors: {
          primary: '#FFFFFF',
          secondary: '#000000'
        }
      };
      
      mockAxios.onGet('/themes/user').reply(200, mockTheme);
      
      const result = await themeAPI.getUserTheme();
      
      expect(mockAxios.history.get.length).toBe(1);
      expect(mockAxios.history.get[0].url).toBe('/themes/user');
      expect(result).toEqual(mockTheme);
    });
  });
}); 