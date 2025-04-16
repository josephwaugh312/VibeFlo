// Mock the database module
jest.mock('../../db');

// Import mocked db
import { db, where, first, insert, update, join, select, returning } from '../../db';

// Import the theme service
import * as themeService from '../../services/theme.service';

describe('Theme Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setUserTheme', () => {
    it('should update a user theme preference when user settings exist', async () => {
      // Configure mocks
      // First query - check if theme exists
      first.mockResolvedValueOnce({ id: 4, name: 'Minimalist' });
      
      // Second query - check if user settings exist
      first.mockResolvedValueOnce({ user_id: 1, theme_id: 8 });
      
      // Mock the database function calls to return mocked query builder
      const mockDbChain = {
        where,
        first,
        update,
        returning,
      };
      db.mockReturnValue(mockDbChain);
      
      // Call the function
      const result = await themeService.setUserTheme(1, 4);
      
      // Verify the result
      expect(result).toEqual({ success: true, theme_id: 4 });
      
      // Check that where was called with correct params
      expect(db).toHaveBeenCalledWith('themes');
      expect(db).toHaveBeenCalledWith('user_settings');
      expect(where).toHaveBeenCalledWith({ id: 4 });
      expect(where).toHaveBeenCalledWith({ user_id: 1 });
      
      // Check update was called with correct theme_id
      expect(update).toHaveBeenCalledWith({ theme_id: 4 });
    });

    it('should insert a new user theme preference when no settings exist', async () => {
      // Configure mocks
      // First query - check if theme exists
      first.mockResolvedValueOnce({ id: 4, name: 'Minimalist' });
      
      // Second query - check if user settings exist (return null for no settings)
      first.mockResolvedValueOnce(null);
      
      // Mock the database function calls to return mocked query builder
      const mockDbChain = {
        where,
        first,
        insert,
        returning,
      };
      db.mockReturnValue(mockDbChain);
      
      // Call the function
      const result = await themeService.setUserTheme(1, 4);
      
      // Verify the result
      expect(result).toEqual({ success: true, theme_id: 4 });
      
      // Check db calls
      expect(db).toHaveBeenCalledWith('themes');
      expect(db).toHaveBeenCalledWith('user_settings');
      expect(where).toHaveBeenCalledWith({ id: 4 });
      expect(where).toHaveBeenCalledWith({ user_id: 1 });
      
      // Check insert was called with correct data
      expect(insert).toHaveBeenCalledWith({
        user_id: 1,
        theme_id: 4
      });
    });

    it('should return an error when theme does not exist', async () => {
      // Configure mocks
      // First query - check if theme exists (return null for no theme)
      first.mockResolvedValueOnce(null);
      
      // Mock the database function calls to return mocked query builder
      const mockDbChain = {
        where,
        first,
      };
      db.mockReturnValue(mockDbChain);
      
      // Call the function
      const result = await themeService.setUserTheme(1, 999);
      
      // Verify the result
      expect(result).toEqual({
        success: false,
        error: 'Theme not found'
      });
      
      // Check db calls
      expect(db).toHaveBeenCalledWith('themes');
      expect(where).toHaveBeenCalledWith({ id: 999 });
      
      // Ensure insert wasn't called
      expect(insert).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('getUserTheme', () => {
    it('should return the user\'s theme preference when set', async () => {
      // Configure mocks
      // Return a theme from the user settings query
      first.mockResolvedValueOnce({
        id: 4,
        name: 'Minimalist',
        background: 'linear-gradient(to right, #000000, #434343)',
        text_color: '#ffffff'
      });
      
      // Mock the database function calls to return mocked query builder
      const mockDbChain = {
        where,
        join,
        select,
        first,
      };
      db.mockReturnValue(mockDbChain);
      
      // Call the function
      const result = await themeService.getUserTheme(1);
      
      // Verify the result
      expect(result).toEqual({
        id: 4,
        name: 'Minimalist',
        background: 'linear-gradient(to right, #000000, #434343)',
        text_color: '#ffffff'
      });
      
      // Check that query was made correctly
      expect(db).toHaveBeenCalledWith('user_settings');
      expect(join).toHaveBeenCalledWith('themes', 'user_settings.theme_id', '=', 'themes.id');
      expect(where).toHaveBeenCalledWith({ user_id: 1 });
      expect(select).toHaveBeenCalledWith('themes.*');
    });

    it('should return default theme when user has no preference', async () => {
      // Configure mocks
      // First query - user settings (return null for no settings)
      first.mockResolvedValueOnce(null);
      
      // Second query - default theme
      first.mockResolvedValueOnce({
        id: 1,
        name: 'Forest',
        background: 'linear-gradient(to right, #0f9b0f, #000000)',
        text_color: '#ffffff'
      });
      
      // Mock the database function calls to return mocked query builder
      const mockDbChain = {
        where,
        join,
        select,
        first,
      };
      db.mockReturnValue(mockDbChain);
      
      // Call the function
      const result = await themeService.getUserTheme(1);
      
      // Verify the result
      expect(result).toEqual({
        id: 1,
        name: 'Forest',
        background: 'linear-gradient(to right, #0f9b0f, #000000)',
        text_color: '#ffffff'
      });
      
      // Check that both queries were made
      expect(db).toHaveBeenCalledWith('user_settings');
      expect(db).toHaveBeenCalledWith('themes');
      expect(where).toHaveBeenCalledWith({ user_id: 1 });
      expect(where).toHaveBeenCalledWith({ id: 1 });
    });
  });
}); 