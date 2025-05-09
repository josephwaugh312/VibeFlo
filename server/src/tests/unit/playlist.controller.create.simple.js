/**
 * Simplified playlist controller test
 * Uses plain JavaScript to avoid TypeScript issues
 */

// Import the createPlaylist from a simplified controller we'll create
const { createPlaylist } = require('../../controllers/playlist.controller.simple');

// Mock database
jest.mock('../../config/db', () => ({
  pool: {
    query: jest.fn()
  }
}));

describe('Playlist Controller - Create (Simple JS)', () => {
  let mockRequest;
  let mockResponse;
  let mockPool;

  beforeEach(() => {
    // Create mock request
    mockRequest = {
      body: {
        name: 'Test Playlist',
        description: 'Test Description'
      },
      user: {
        id: 123,
        username: 'testuser'
      },
      app: {
        locals: {
          db: {
            pool: {
              query: jest.fn()
            }
          }
        }
      }
    };

    // Create mock response
    mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(() => mockResponse)
    };
    
    // Get the mock db pool from the app object
    mockPool = mockRequest.app.locals.db.pool;

    // Reset all mocks
    jest.clearAllMocks();
  });
  
  it('should return 401 if user is not authenticated', async () => {
    // Setup request with no user
    mockRequest.user = undefined;
    
    // Call the controller directly
    await createPlaylist(mockRequest, mockResponse);
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authenticated'
    });
  });

  it('should return 400 if name is missing', async () => {
    // Setup request with missing name
    mockRequest.body = { description: 'Test Description' };
    
    // Call the controller directly
    await createPlaylist(mockRequest, mockResponse);
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Playlist name is required'
    });
  });

  it('should create a playlist successfully', async () => {
    // Mock database query to return a new playlist
    const mockPlaylist = {
      id: 1,
      user_id: 123,
      name: 'Test Playlist',
      description: 'Test Description',
      created_at: new Date().toISOString()
    };
    
    mockPool.query.mockResolvedValueOnce({
      rows: [mockPlaylist],
      rowCount: 1
    });
    
    // Call the controller directly
    await createPlaylist(mockRequest, mockResponse);
    
    // Verify database was called with correct parameters
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO playlists'),
      expect.arrayContaining([
        123, // user_id
        'Test Playlist', // name
        'Test Description' // description
      ])
    );
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Playlist created successfully',
      playlist: mockPlaylist
    });
  });
}); 