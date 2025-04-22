import { Request, Response } from 'express';
import { getAllThemes, getThemeById, getPublicCustomThemes, getUserCustomThemes, createCustomTheme, updateCustomTheme, deleteCustomTheme, setUserTheme, getUserTheme } from '../../controllers/theme.controller';
import pool from '../../config/db';

// Mock the database pool
jest.mock('../../config/db', () => {
  return {
    query: jest.fn()
  };
});

describe('Theme Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockAuthRequest: Partial<Request & { user?: any }>;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock response with spy functions
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Default mock request
    mockRequest = {};
    
    // Default authenticated request
    mockAuthRequest = {
      user: {
        id: 1,
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com'
      }
    };
    
    // Mock console.error to prevent noise in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  describe('getAllThemes', () => {
    it('should return all themes', async () => {
      // Mock database response
      const mockThemes = [
        { id: 1, name: 'Light', is_default: true, colors: { primary: '#ffffff' } },
        { id: 2, name: 'Dark', is_default: false, colors: { primary: '#000000' } }
      ];
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockThemes,
        rowCount: mockThemes.length
      });
      
      // Call the controller
      await getAllThemes(mockRequest as Request, mockResponse as Response);
      
      // Verify database was queried
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM themes ORDER BY is_default DESC, name ASC'
      );
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockThemes);
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      // Call the controller
      await getAllThemes(mockRequest as Request, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
      
      // Verify console.error was called
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('getThemeById', () => {
    beforeEach(() => {
      mockRequest = {
        params: {
          id: '1'
        }
      };
    });
    
    it('should return a theme by ID', async () => {
      // Mock database response
      const mockTheme = { id: 1, name: 'Light', is_default: true, colors: { primary: '#ffffff' } };
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockTheme],
        rowCount: 1
      });
      
      // Call the controller
      await getThemeById(mockRequest as Request, mockResponse as Response);
      
      // Verify database was queried
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM themes WHERE id = $1',
        ['1']
      );
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockTheme);
    });
    
    it('should return 404 if theme not found', async () => {
      // Mock empty database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });
      
      // Call the controller
      await getThemeById(mockRequest as Request, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Theme not found' });
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      // Call the controller
      await getThemeById(mockRequest as Request, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
  
  describe('getPublicCustomThemes', () => {
    it('should return all public custom themes', async () => {
      // Mock database response
      const mockThemes = [
        { id: 1, name: 'Custom Theme 1', is_public: true, creator: 'Test User' },
        { id: 2, name: 'Custom Theme 2', is_public: true, creator: 'Another User' }
      ];
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockThemes,
        rowCount: mockThemes.length
      });
      
      // Call the controller
      await getPublicCustomThemes(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockThemes);
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      // Call the controller
      await getPublicCustomThemes(mockRequest as Request, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
  
  describe('getUserCustomThemes', () => {
    it('should return 401 if user not authenticated', async () => {
      // Setup unauthenticated request
      const unauthRequest = { user: null };
      
      // Call the controller
      await getUserCustomThemes(unauthRequest as any, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });
    
    it('should return user custom themes', async () => {
      // Mock database response
      const mockThemes = [
        { id: 1, name: 'My Theme 1', user_id: 1 },
        { id: 2, name: 'My Theme 2', user_id: 1 }
      ];
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockThemes,
        rowCount: mockThemes.length
      });
      
      // Call the controller
      await getUserCustomThemes(mockAuthRequest as any, mockResponse as Response);
      
      // Verify database was queried
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM custom_themes WHERE user_id = $1 ORDER BY created_at DESC',
        [1]
      );
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockThemes);
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      // Call the controller
      await getUserCustomThemes(mockAuthRequest as any, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('createCustomTheme', () => {
    beforeEach(() => {
      mockAuthRequest = {
        user: {
          id: 1,
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com'
        },
        body: {
          name: 'My New Theme',
          description: 'A test theme',
          image_url: 'https://example.com/image.jpg',
          is_public: false,
          prompt: 'Test prompt'
        }
      };
    });
    
    it('should return 401 if user not authenticated', async () => {
      // Setup unauthenticated request
      const unauthRequest = { 
        user: null,
        body: mockAuthRequest.body 
      };
      
      // Call the controller
      await createCustomTheme(unauthRequest as any, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });
    
    it('should return 400 if name or image_url is missing', async () => {
      // Setup request with missing required fields
      const invalidRequest = {
        user: { id: 1 },
        body: {
          description: 'A test theme',
          is_public: false
        }
      };
      
      // Call the controller
      await createCustomTheme(invalidRequest as any, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Name and image URL are required' });
    });
    
    it('should create a private custom theme successfully', async () => {
      // Mock database response
      const mockTheme = {
        id: 1,
        user_id: 1,
        name: 'My New Theme',
        description: 'A test theme',
        image_url: 'https://example.com/image.jpg',
        is_public: false,
        prompt: 'Test prompt',
        moderation_status: null,
        moderation_notes: null
      };
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockTheme],
        rowCount: 1
      });
      
      // Call the controller
      await createCustomTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO custom_themes'),
        expect.arrayContaining([
          1, // user_id
          'My New Theme', // name
          'A test theme', // description
          'https://example.com/image.jpg', // image_url
          false, // is_public (private theme)
          'Test prompt', // prompt
          null, // moderation_status (null for private)
          null  // moderation_notes (null for private)
        ])
      );
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockTheme,
          message: 'Theme created successfully.'
        })
      );
    });
    
    it('should handle public theme submission with pending moderation', async () => {
      // Setup request for public theme
      mockAuthRequest.body.is_public = true;
      
      // Mock database response
      const mockTheme = {
        id: 1,
        user_id: 1,
        name: 'My New Theme',
        description: 'A test theme',
        image_url: 'https://example.com/image.jpg',
        is_public: false, // Will be false until approved
        prompt: 'Test prompt',
        moderation_status: 'pending',
        moderation_notes: 'Theme pending moderation review'
      };
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockTheme],
        rowCount: 1
      });
      
      // Call the controller
      await createCustomTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO custom_themes'),
        expect.arrayContaining([
          1, // user_id
          'My New Theme', // name
          'A test theme', // description
          'https://example.com/image.jpg', // image_url
          false, // is_public (false until approved)
          'Test prompt', // prompt
          'pending', // moderation_status
          'Theme pending moderation review' // moderation_notes
        ])
      );
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockTheme,
          message: 'Your theme has been submitted for moderation and will be public once approved.'
        })
      );
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      // Call the controller
      await createCustomTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
  
  describe('updateCustomTheme', () => {
    beforeEach(() => {
      mockAuthRequest = {
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com'
        },
        params: {
          id: '1'
        },
        body: {
          name: 'Updated Theme',
          description: 'Updated description',
          image_url: 'https://example.com/updated.jpg',
          is_public: true
        }
      };
    });
    
    it('should return 401 if user not authenticated', async () => {
      // Setup unauthenticated request
      const unauthRequest = { 
        user: null,
        params: { id: '1' },
        body: mockAuthRequest.body 
      };
      
      // Call the controller
      await updateCustomTheme(unauthRequest as any, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });
    
    it('should return 404 if theme not found or not owned by user', async () => {
      // Mock empty database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });
      
      // Call the controller
      await updateCustomTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Theme not found or not owned by user' });
    });
    
    it('should update a private theme to public with pending moderation', async () => {
      // Mock database response for existing theme
      const existingTheme = {
        id: 1,
        user_id: 1,
        name: 'Original Theme',
        description: 'Original description',
        image_url: 'https://example.com/original.jpg',
        is_public: false,
        moderation_status: null,
        moderation_notes: null
      };
      
      // Mock updated theme with an additional message field
      const updatedTheme = {
        ...existingTheme,
        name: 'Updated Theme',
        description: 'Updated description',
        image_url: 'https://example.com/updated.jpg',
        is_public: false, // Will be false until approved
        moderation_status: 'pending',
        moderation_notes: 'Theme pending moderation review',
        message: 'Your theme has been submitted for moderation and will be public once approved.'
      };
      
      // Setup sequential mock responses
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [existingTheme], rowCount: 1 }) // Check if theme exists
        .mockResolvedValueOnce({ rows: [updatedTheme], rowCount: 1 });  // Update theme
      
      // Call the controller
      await updateCustomTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify response includes the additional message field
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Your theme has been submitted for moderation and will be public once approved.'
        })
      );
    });
    
    it('should update a theme without changing public status', async () => {
      // Setup request with no change to is_public
      mockAuthRequest.body = {
        name: 'Updated Theme',
        description: 'Updated description'
      };
      
      // Mock database response for existing theme (already public)
      const existingTheme = {
        id: 1,
        user_id: 1,
        name: 'Original Theme',
        description: 'Original description',
        image_url: 'https://example.com/original.jpg',
        is_public: true,
        moderation_status: 'approved',
        moderation_notes: null
      };
      
      // Mock updated theme with an additional message field
      const updatedTheme = {
        ...existingTheme,
        name: 'Updated Theme',
        description: 'Updated description',
        message: 'Theme updated successfully.'
      };
      
      // Setup sequential mock responses
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [existingTheme], rowCount: 1 }) // Check if theme exists
        .mockResolvedValueOnce({ rows: [updatedTheme], rowCount: 1 });  // Update theme
      
      // Call the controller
      await updateCustomTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify response includes the additional message field
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Theme updated successfully.'
        })
      );
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      // Call the controller
      await updateCustomTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
  
  describe('deleteCustomTheme', () => {
    beforeEach(() => {
      mockAuthRequest = {
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com'
        },
        params: {
          id: '1'
        }
      };
    });
    
    it('should return 401 if user not authenticated', async () => {
      // Setup unauthenticated request
      const unauthRequest = { 
        user: null,
        params: { id: '1' }
      };
      
      // Call the controller
      await deleteCustomTheme(unauthRequest as any, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });
    
    it('should delete custom theme successfully', async () => {
      // First query checks if theme exists
      (pool.query as jest.Mock).mockImplementation((query: string, params: any[]) => {
        if (query.includes('SELECT')) {
          return Promise.resolve({ rows: [{ id: 1, user_id: 1 }], rowCount: 1 });
        } else if (query.includes('DELETE')) {
          return Promise.resolve({ rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      
      // Call the controller
      await deleteCustomTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Theme deleted successfully' });
    });
    
    it('should return 404 if theme not found or not owned by user', async () => {
      // Mock database response for theme check
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [], // No theme found
        rowCount: 0
      });
      
      // Call the controller
      await deleteCustomTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Theme not found or not owned by user' });
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      // Call the controller
      await deleteCustomTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('setUserTheme', () => {
    beforeEach(() => {
      mockAuthRequest = {
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com'
        },
        body: {
          theme_id: '2' // Changed from themeId to theme_id to match controller
        }
      };

      // Mock console.log to prevent noise in test output
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });
    
    it('should return 401 if user not authenticated', async () => {
      // Setup unauthenticated request
      const unauthRequest = { 
        user: null,
        body: { theme_id: '2' }
      };
      
      // Call the controller
      await setUserTheme(unauthRequest as any, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });
    
    it('should return 400 if theme_id is missing', async () => {
      // Setup request with missing theme_id
      const invalidRequest = {
        user: { id: 1 },
        body: {}
      };
      
      // Call the controller
      await setUserTheme(invalidRequest as any, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Theme ID is required' });
    });
    
    it('should return default theme if requested theme not found', async () => {
      // Mock database responses - theme not found in either table
      const defaultTheme = { id: 1, name: 'Default Theme', is_default: true };
      
      (pool.query as jest.Mock).mockImplementation((query: string, params: any[]) => {
        if (query.includes('SELECT * FROM themes WHERE id = $1')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        } else if (query.includes('SELECT * FROM custom_themes WHERE id = $1')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        } else if (query.includes('SELECT * FROM themes WHERE is_default = true')) {
          return Promise.resolve({ rows: [defaultTheme], rowCount: 1 });
        } else if (query.includes('SELECT * FROM user_settings')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        } else if (query.includes('INSERT INTO user_settings')) {
          return Promise.resolve({ rows: [{ user_id: 1, theme_id: defaultTheme.id }], rowCount: 1 });
        } else if (query.includes('SELECT theme_id FROM user_settings')) {
          return Promise.resolve({ rows: [{ theme_id: defaultTheme.id }], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      
      // Call the controller
      await setUserTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify response has default theme
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ 
        message: 'Default theme set (requested theme not found)', 
        theme_id: 1,
        theme: defaultTheme
      }));
    });
    
    it('should set system theme for user successfully', async () => {
      // Mock theme found in system themes
      const mockTheme = { id: 2, name: 'Dark', is_default: false, image_url: 'dark.jpg' };
      
      // Mock setting user theme responses
      (pool.query as jest.Mock).mockImplementation((query: string, params: any[]) => {
        if (query.includes('SELECT * FROM themes WHERE id = $1')) {
          return Promise.resolve({ rows: [mockTheme], rowCount: 1 });
        } else if (query.includes('SELECT * FROM user_settings')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        } else if (query.includes('SELECT theme_id FROM user_settings')) {
          return Promise.resolve({ 
            rows: [{ theme_id: 2 }], 
            rowCount: 1 
          });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      
      // Call the controller
      await setUserTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify successful response
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Theme updated successfully',
        theme_id: 2,
        theme: mockTheme 
      });
    });
    
    it('should update existing user theme settings', async () => {
      // Mock theme found in system themes
      const mockTheme = { id: 2, name: 'Dark', is_default: false, image_url: 'dark.jpg' };
      
      // Mock existing user settings
      const existingSettings = { id: 1, user_id: 1, theme_id: 1 };
      
      // Setup sequential mock responses
      (pool.query as jest.Mock).mockImplementation((query: string, params: any[]) => {
        if (query.includes('SELECT * FROM themes WHERE id = $1')) {
          return Promise.resolve({ rows: [mockTheme], rowCount: 1 });
        } else if (query.includes('SELECT * FROM user_settings')) {
          return Promise.resolve({ rows: [existingSettings], rowCount: 1 });
        } else if (query.includes('SELECT theme_id FROM user_settings')) {
          return Promise.resolve({ 
            rows: [{ theme_id: 2 }], 
            rowCount: 1 
          });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      
      // Call the controller
      await setUserTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify successful response
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Theme updated successfully',
        theme_id: 2,
        theme: mockTheme 
      });
    });
    
    it('should check custom themes if not found in system themes', async () => {
      // Mock custom theme
      const mockCustomTheme = { id: 2, name: 'Custom Theme', user_id: 1, is_public: true, image_url: 'custom.jpg' };
      
      // Setup mock responses
      (pool.query as jest.Mock).mockImplementation((query: string, params: any[]) => {
        if (query.includes('SELECT * FROM themes WHERE id = $1')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        } else if (query.includes('SELECT * FROM custom_themes WHERE id = $1')) {
          return Promise.resolve({ rows: [mockCustomTheme], rowCount: 1 });
        } else if (query.includes('SELECT * FROM user_settings')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        } else if (query.includes('SELECT theme_id FROM user_settings')) {
          return Promise.resolve({ 
            rows: [{ theme_id: 2 }], 
            rowCount: 1 
          });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      
      // Call the controller
      await setUserTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify successful response
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Theme updated successfully',
        theme_id: 2,
        theme: mockCustomTheme 
      });
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      // Call the controller
      await setUserTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
  
  describe('getUserTheme', () => {
    beforeEach(() => {
      // Mock console.log to prevent noise in test output
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });
    
    it('should return 401 if user not authenticated', async () => {
      // Setup unauthenticated request
      const unauthRequest = { user: null };
      
      // Call the controller
      await getUserTheme(unauthRequest as any, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });
    
    it('should return default theme if user has no theme settings', async () => {
      // Mock default theme
      const defaultTheme = { id: 1, name: 'Light', is_default: true, image_url: 'light.jpg' };
      
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query: string, params: any[]) => {
        if (query.includes('SELECT theme_id FROM user_settings')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        } else if (query.includes('SELECT * FROM themes WHERE is_default = true')) {
          return Promise.resolve({ rows: [defaultTheme], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      
      // Call the controller
      await getUserTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(defaultTheme);
    });
    
    it('should return user theme from settings if exists in standard themes', async () => {
      // Mock user settings with theme ID
      const userSettings = { user_id: 1, theme_id: 2 };
      
      // Mock theme data
      const themeData = { id: 2, name: 'Dark', is_default: false, image_url: 'dark.jpg' };
      
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query: string, params: any[]) => {
        if (query.includes('SELECT theme_id FROM user_settings')) {
          return Promise.resolve({ rows: [userSettings], rowCount: 1 });
        } else if (query.includes('SELECT * FROM themes WHERE id = $1')) {
          return Promise.resolve({ rows: [themeData], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      
      // Call the controller
      await getUserTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(themeData);
    });
    
    it('should check custom themes if not found in system themes', async () => {
      // Mock user settings with theme ID
      const userSettings = { user_id: 1, theme_id: 3 };
      
      // Mock custom theme
      const customTheme = { id: 3, name: 'Custom Dark', user_id: 1, image_url: 'custom.jpg' };
      
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query: string, params: any[]) => {
        if (query.includes('SELECT theme_id FROM user_settings')) {
          return Promise.resolve({ rows: [userSettings], rowCount: 1 });
        } else if (query.includes('SELECT * FROM themes WHERE id = $1')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        } else if (query.includes('SELECT * FROM custom_themes WHERE id = $1')) {
          return Promise.resolve({ rows: [customTheme], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      
      // Call the controller
      await getUserTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(customTheme);
    });
    
    it('should fall back to default theme if user theme not found', async () => {
      // Mock user settings with theme ID
      const userSettings = { user_id: 1, theme_id: 99 }; // Non-existent theme ID
      
      // Mock default theme
      const defaultTheme = { id: 1, name: 'Light', is_default: true, image_url: 'light.jpg' };
      
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query: string, params: any[]) => {
        if (query.includes('SELECT theme_id FROM user_settings')) {
          return Promise.resolve({ rows: [userSettings], rowCount: 1 });
        } else if (query.includes('SELECT * FROM themes WHERE id = $1')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        } else if (query.includes('SELECT * FROM custom_themes WHERE id = $1')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        } else if (query.includes('SELECT * FROM themes WHERE is_default = true')) {
          return Promise.resolve({ rows: [defaultTheme], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      
      // Call the controller
      await getUserTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(defaultTheme);
    });
    
    it('should return 404 if no theme and no default theme found', async () => {
      // Mock user settings with theme ID
      const userSettings = { user_id: 1, theme_id: 99 }; // Non-existent theme ID
      
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query: string, params: any[]) => {
        if (query.includes('SELECT theme_id FROM user_settings')) {
          return Promise.resolve({ rows: [userSettings], rowCount: 1 });
        } else if (query.includes('SELECT * FROM themes WHERE id = $1')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        } else if (query.includes('SELECT * FROM custom_themes WHERE id = $1')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        } else if (query.includes('SELECT * FROM themes WHERE is_default = true')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      
      // Call the controller
      await getUserTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'No default theme found' });
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      // Call the controller
      await getUserTheme(mockAuthRequest as any, mockResponse as Response);
      
      // Verify response status and body
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
}); 