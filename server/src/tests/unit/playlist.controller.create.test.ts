/**
 * Rename this file to playlist.controller.create.simple.test.js
 * to avoid TypeScript compilation issues
 */

/**
 * Playlist Controller Create Playlist Tests
 * 
 * This file tests the createPlaylist function from test-specific implementation
 */

const { createPlaylist } = require('./playlist.controller-create-test-fixes.js');

// Mock DB
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

describe('Playlist Controller - Create', () => {
  let mockRequest;
  let mockResponse;
  let mockPool;

  beforeEach(() => {
    mockRequest = {
      body: {
        name: 'Test Playlist',
        description: 'This is a test playlist'
      },
      user: {
        id: 123,
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com'
      },
      app: {
        locals: {
          db: {
            pool: require('../../config/db')
          }
        }
      }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockPool = require('../../config/db');
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should create a playlist successfully', async () => {
    // Mock successful database query response
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        name: 'Test Playlist',
        description: 'This is a test playlist',
        user_id: 123,
        created_at: new Date(),
        updated_at: new Date()
      }]
    });

    // Call the controller
    await createPlaylist(mockRequest, mockResponse);

    // Verify database was called with correct parameters
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO playlists/),
      [123, 'Test Playlist', 'This is a test playlist']
    );

    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      playlist: expect.objectContaining({
        id: 1,
        name: 'Test Playlist',
        description: 'This is a test playlist',
        user_id: 123
      })
    });
  });

  it('should return 400 if name is missing', async () => {
    // Set up request with missing name
    mockRequest.body = {
      description: 'This is a test playlist'
    };

    // Call the controller
    await createPlaylist(mockRequest, mockResponse);

    // Verify database was not called
    expect(mockPool.query).not.toHaveBeenCalled();

    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Playlist name is required'
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    // Set up request with no user
    mockRequest.user = undefined;

    // Call the controller
    await createPlaylist(mockRequest, mockResponse);

    // Verify database was not called
    expect(mockPool.query).not.toHaveBeenCalled();

    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Unauthorized'
    });
  });

  it('should handle database errors gracefully', async () => {
    // Mock database error
    mockPool.query.mockRejectedValueOnce(new Error('Database error'));

    // Spy on console.error to prevent test output pollution
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Call the controller
    await createPlaylist(mockRequest, mockResponse);

    // Verify error response
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Failed to create playlist'
    });

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
}); 