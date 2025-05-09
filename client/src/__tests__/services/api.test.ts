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
        email: 'user@example.com',
        login: 'user@example.com',
        password: 'password',
        rememberMe: true
      });
      expect(result).toEqual({
        success: true,
        token: 'login-token',
        user: { id: 1, username: 'testuser' },
        message: undefined
      });
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
      mockAxios.onPut('/api/users/me').reply(500, { message: 'Server error' });
      
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
      mockAxios.onPost('/api/users/password').reply(200, { success: true });
      
      const result = await authAPI.changePassword('oldpass', 'newpass');
      
      expect(mockAxios.history.post[0].url).toBe('/api/users/password');
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual({
        currentPassword: 'oldpass',
        newPassword: 'newpass'
      });
      expect(result).toEqual({ success: true });
    });
    
    it('should handle errors in changePassword', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      
      mockAxios.onPost('/api/users/password').reply(400, { message: 'Current password is incorrect' });
      
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
      mockAxios.onDelete('/api/users/delete').reply(200, { success: true });
      
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
      
      mockAxios.onGet('/api/playlists').reply(200, mockPlaylists);
      
      const result = await playlistAPI.getUserPlaylists();
      
      expect(mockAxios.history.get[0].url).toBe('/api/playlists');
      expect(result).toEqual(mockPlaylists);
      expect(consoleLogSpy).toHaveBeenCalledWith('API Retry: Attempt 1 of 3');
    });
    
    it('should handle errors in getUserPlaylists', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      
      mockAxios.onGet('/api/playlists').reply(500, { message: 'Server error' });
      
      try {
        await playlistAPI.getUserPlaylists();
        fail('Should have thrown an error');
      } catch (error) {
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(mockAxios.history.get.length).toBe(1);
      }
    });
    
    it('should reject non-numeric IDs in getPlaylist', async () => {
      mockAxios.onGet('/api/playlists/abc').reply(404, { message: 'Playlist not found' });
      
      try {
        await playlistAPI.getPlaylist('abc');
        fail('Should have rejected non-numeric ID');
      } catch (error: any) {
        expect(error.message).toBe('Request failed with status code 404');
        expect(mockAxios.history.get.length).toBe(1);
      }
    });
    
    it('should accept numeric ID strings in getPlaylist', async () => {
      mockAxios.onGet('/api/playlists/123').reply(200, {
        id: 123, 
        name: 'Test Playlist'
      });
      
      const result = await playlistAPI.getPlaylist('123');
      
      expect(mockAxios.history.get[0].url).toBe('/api/playlists/123');
      expect(result).toEqual({
        id: 123, 
        name: 'Test Playlist'
      });
    });
    
    it('should create a playlist with tracks in the correct format', async () => {
      mockAxios.onPost('/api/playlists').reply(200, {
        id: 1,
        name: 'New Playlist',
        tracks: [{ id: 't1', title: 'Song 1' }]
      });
      
      const result = await playlistAPI.createPlaylist('New Playlist', [
        { id: 't1', title: 'Song 1', artist: 'Artist 1', url: 'song1.mp3' }
      ]);
      
      expect(mockAxios.history.post[0].url).toBe('/api/playlists');
      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.name).toBe('New Playlist');
      expect(requestData.tracks.length).toBe(1);
      expect(requestData.tracks[0].id).toBe('t1');
      expect(requestData.tracks[0].title).toBe('Song 1');
      expect(result).toEqual({
        id: 1,
        name: 'New Playlist',
        tracks: [{ id: 't1', title: 'Song 1' }]
      });
    });
    
    it('should call updatePlaylist with the correct data', async () => {
      mockAxios.onPut('/api/playlists/123').reply(200, {
        id: 123,
        name: 'Updated Playlist'
      });
      
      const result = await playlistAPI.updatePlaylist('123', { name: 'Updated Playlist' });
      
      expect(mockAxios.history.put[0].url).toBe('/api/playlists/123');
      expect(JSON.parse(mockAxios.history.put[0].data)).toEqual({ name: 'Updated Playlist' });
      expect(result).toEqual({
        id: 123,
        name: 'Updated Playlist'
      });
    });
    
    it('should reject non-numeric IDs in updatePlaylist', async () => {
      mockAxios.onPut('/api/playlists/abc').reply(404, { message: 'Playlist not found' });
      
      try {
        await playlistAPI.updatePlaylist('abc', { name: 'Bad ID Playlist' });
        fail('Should have rejected non-numeric ID');
      } catch (error: any) {
        expect(error.message).toBe('Request failed with status code 404');
        expect(mockAxios.history.put.length).toBe(1);
      }
    });
    
    it('should call deletePlaylist with the correct ID', async () => {
      mockAxios.onDelete('/api/playlists/123').reply(200, { success: true });
      
      const result = await playlistAPI.deletePlaylist('123');
      
      expect(mockAxios.history.delete[0].url).toBe('/api/playlists/123');
      expect(result).toEqual({ success: true });
    });
    
    it('should reject non-numeric IDs in deletePlaylist', async () => {
      mockAxios.onDelete('/api/playlists/abc').reply(404, { message: 'Playlist not found' });
      
      try {
        await playlistAPI.deletePlaylist('abc');
        fail('Should have rejected non-numeric ID');
      } catch (error: any) {
        expect(error.message).toBe('Request failed with status code 404');
        expect(mockAxios.history.delete.length).toBe(1);
      }
    });
    
    it('should handle missing optional fields when adding a track', async () => {
      mockAxios.onPost('/api/playlists/123/songs').reply(200, {
        id: 't1',
        title: 'New Song',
        added_at: '2023-05-01T12:00:00Z'
      });
      
      const result = await playlistAPI.addTrackToPlaylist('123', {
        id: 't1',
        title: 'New Song',
        artist: 'Test Artist',
        url: 'newsong.mp3'
      });
      
      expect(mockAxios.history.post[0].url).toBe('/api/playlists/123/songs');
      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.title).toBe('New Song');
      expect(requestData.artist).toBe('Test Artist');
      // Should handle missing fields gracefully
      expect(requestData.duration).toBe(0); // Default value for missing duration
      expect(result).toEqual({
        id: 't1',
        title: 'New Song',
        added_at: '2023-05-01T12:00:00Z'
      });
    });
  });
  
  describe('Settings API Methods', () => {
    it('should call getUserSettings with the correct endpoint', async () => {
      mockAxios.onGet('/api/settings').reply(200, {
        theme: 'dark',
        notifications: true
      });
      
      const result = await settingsAPI.getUserSettings();
      
      expect(mockAxios.history.get[0].url).toBe('/api/settings');
      expect(result).toEqual({
        theme: 'dark',
        notifications: true
      });
    });
    
    it('should call updateUserSettings with the correct data', async () => {
      mockAxios.onPut('/api/settings').reply(200, {
        theme: 'light',
        notifications: false
      });
      
      const result = await settingsAPI.updateUserSettings({
        theme: 'light',
        notifications: false
      });
      
      expect(mockAxios.history.put[0].url).toBe('/api/settings');
      expect(JSON.parse(mockAxios.history.put[0].data)).toEqual({
        theme: 'light',
        notifications: false
      });
      expect(result).toEqual({
        theme: 'light',
        notifications: false
      });
    });
  });
  
  describe('Pomodoro API Methods', () => {
    it('should call getAllSessions with the correct endpoint', async () => {
      mockAxios.onGet('/api/pomodoro/sessions').reply(200, [
        { id: 1, duration: 25, completed: true },
        { id: 2, duration: 15, completed: false }
      ]);
      
      const result = await pomodoroAPI.getAllSessions();
      
      expect(mockAxios.history.get[0].url).toBe('/api/pomodoro/sessions');
      expect(result).toEqual([
        { id: 1, duration: 25, completed: true },
        { id: 2, duration: 15, completed: false }
      ]);
    });
    
    it('should call createSession with the correct data', async () => {
      mockAxios.onPost('/api/pomodoro/sessions').reply(200, {
        id: 3,
        duration: 30,
        completed: true
      });
      
      const result = await pomodoroAPI.createSession({
        duration: 30,
        completed: true
      });
      
      expect(mockAxios.history.post[0].url).toBe('/api/pomodoro/sessions');
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual({
        duration: 30,
        completed: true
      });
      expect(result).toEqual({
        id: 3,
        duration: 30,
        completed: true
      });
    });
    
    it('should call updateSession with the correct data', async () => {
      mockAxios.onPut('/api/pomodoro/sessions/123').reply(200, {
        id: 123,
        duration: 45,
        completed: true
      });
      
      const result = await pomodoroAPI.updateSession(123, {
        duration: 45,
        completed: true
      });
      
      expect(mockAxios.history.put[0].url).toBe('/api/pomodoro/sessions/123');
      expect(JSON.parse(mockAxios.history.put[0].data)).toEqual({
        duration: 45,
        completed: true
      });
      expect(result).toEqual({
        id: 123,
        duration: 45,
        completed: true
      });
    });
    
    it('should call deleteSession with the correct ID', async () => {
      mockAxios.onDelete('/api/pomodoro/sessions/123').reply(200, { success: true });
      
      const result = await pomodoroAPI.deleteSession(123);
      
      expect(mockAxios.history.delete[0].url).toBe('/api/pomodoro/sessions/123');
      expect(result).toEqual({ success: true });
    });
    
    it('should call getStats with the correct endpoint', async () => {
      mockAxios.onGet('/api/pomodoro/stats').reply(200, {
        totalSessions: 10,
        totalDuration: 250
      });
      
      const result = await pomodoroAPI.getStats();
      
      expect(mockAxios.history.get[0].url).toBe('/api/pomodoro/stats');
      expect(result).toEqual({
        totalSessions: 10,
        totalDuration: 250
      });
    });
    
    it('should call saveTodos with the correct data format', async () => {
      mockAxios.onPost('/api/pomodoro/todos').reply(200, {
        success: true,
        todos: [
          { id: 't1', text: 'Todo 1', completed: false },
          { id: 't2', text: 'Todo 2', completed: true }
        ]
      });
      
      const result = await pomodoroAPI.saveTodos([
        { id: 't1', text: 'Todo 1', completed: false },
        { id: 't2', text: 'Todo 2', completed: true }
      ]);
      
      expect(mockAxios.history.post[0].url).toBe('/api/pomodoro/todos');
      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.todos.length).toBe(2);
      expect(requestData.todos[0].id).toBe('t1');
      expect(requestData.todos[1].completed).toBe(true);
      expect(result).toEqual({
        success: true,
        todos: [
          { id: 't1', text: 'Todo 1', completed: false },
          { id: 't2', text: 'Todo 2', completed: true }
        ]
      });
    });
  });
  
  describe('Theme API Methods', () => {
    it('should call getAllThemes with the correct endpoint', async () => {
      mockAxios.onGet('/api/themes').reply(200, [
        { id: 1, name: 'Light' },
        { id: 2, name: 'Dark' }
      ]);
      
      const result = await themeAPI.getAllThemes();
      
      expect(mockAxios.history.get[0].url).toBe('/api/themes');
      expect(result).toEqual([
        { id: 1, name: 'Light' },
        { id: 2, name: 'Dark' }
      ]);
    });
    
    it('should call getThemeById with the correct ID', async () => {
      mockAxios.onGet('/api/themes/123').reply(200, {
        id: 123,
        name: 'Custom Theme'
      });
      
      const result = await themeAPI.getThemeById(123);
      
      expect(mockAxios.history.get[0].url).toBe('/api/themes/123');
      expect(result).toEqual({
        id: 123,
        name: 'Custom Theme'
      });
    });
    
    it('should call getPublicCustomThemes with the correct endpoint', async () => {
      mockAxios.onGet('/api/themes/custom/public').reply(200, [
        { id: 3, name: 'Public Theme 1', user_id: 'user1' },
        { id: 4, name: 'Public Theme 2', user_id: 'user2' }
      ]);
      
      const result = await themeAPI.getPublicCustomThemes();
      
      expect(mockAxios.history.get[0].url).toBe('/api/themes/custom/public');
      expect(result).toEqual([
        { id: 3, name: 'Public Theme 1', user_id: 'user1' },
        { id: 4, name: 'Public Theme 2', user_id: 'user2' }
      ]);
    });
    
    it('should call getUserCustomThemes with the correct endpoint', async () => {
      mockAxios.onGet('/api/themes/custom/user').reply(200, [
        { id: 5, name: 'My Theme 1' },
        { id: 6, name: 'My Theme 2' }
      ]);
      
      const result = await themeAPI.getUserCustomThemes();
      
      expect(mockAxios.history.get[0].url).toBe('/api/themes/custom/user');
      expect(result).toEqual([
        { id: 5, name: 'My Theme 1' },
        { id: 6, name: 'My Theme 2' }
      ]);
    });
    
    it('should call createCustomTheme with the correct data', async () => {
      mockAxios.onPost('/api/themes/custom').reply(200, {
        id: 7,
        name: 'New Theme',
        colors: { primary: '#ff0000' }
      });
      
      const result = await themeAPI.createCustomTheme({
        name: 'New Theme',
        colors: { primary: '#ff0000' }
      });
      
      expect(mockAxios.history.post[0].url).toBe('/api/themes/custom');
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual({
        name: 'New Theme',
        colors: { primary: '#ff0000' }
      });
      expect(result).toEqual({
        id: 7,
        name: 'New Theme',
        colors: { primary: '#ff0000' }
      });
    });
    
    it('should call updateCustomTheme with the correct data', async () => {
      mockAxios.onPut('/api/themes/custom/123').reply(200, {
        id: 123,
        name: 'Updated Theme',
        colors: { primary: '#00ff00' }
      });
      
      const result = await themeAPI.updateCustomTheme(123, {
        name: 'Updated Theme',
        colors: { primary: '#00ff00' }
      });
      
      expect(mockAxios.history.put[0].url).toBe('/api/themes/custom/123');
      expect(JSON.parse(mockAxios.history.put[0].data)).toEqual({
        name: 'Updated Theme',
        colors: { primary: '#00ff00' }
      });
      expect(result).toEqual({
        id: 123,
        name: 'Updated Theme',
        colors: { primary: '#00ff00' }
      });
    });
    
    it('should call deleteCustomTheme with the correct ID', async () => {
      mockAxios.onDelete('/api/themes/custom/123').reply(200, {
        success: true
      });
      
      const result = await themeAPI.deleteCustomTheme(123);
      
      expect(mockAxios.history.delete[0].url).toBe('/api/themes/custom/123');
      expect(result).toEqual({
        success: true
      });
    });
    
    it('should call setUserTheme with the correct format', async () => {
      mockAxios.onPut('/api/themes/user').reply(200, {
        success: true,
        theme_id: 123
      });
      
      const result = await themeAPI.setUserTheme(123);
      
      expect(mockAxios.history.put[0].url).toBe('/api/themes/user');
      expect(JSON.parse(mockAxios.history.put[0].data)).toEqual({
        theme_id: 123
      });
      expect(result).toEqual({
        success: true,
        theme_id: 123
      });
    });
    
    it('should call getUserTheme with the correct endpoint', async () => {
      mockAxios.onGet('/api/themes/user').reply(200, {
        theme_id: 123,
        name: 'User Theme'
      });
      
      const result = await themeAPI.getUserTheme();
      
      expect(mockAxios.history.get[0].url).toBe('/api/themes/user');
      expect(result).toEqual({
        theme_id: 123,
        name: 'User Theme'
      });
    });
  });
}); 