import { Request, Response } from 'express';
import { User } from '../../types';

// Define the AuthRequest interface directly to avoid import issues
interface AuthRequest extends Request {
  user?: User;
}

// Set up mocks before imports
jest.mock('../../config/db', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    connect: jest.fn()
  },
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

// Import after mocks are set up
import { getUserProfile } from '../../controllers/user.controller';
import pool from '../../config/db';

// Mock console to keep tests clean
console.error = jest.fn();
console.log = jest.fn();

describe('User Controller - getUserProfile', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    (pool.query as jest.Mock).mockReset();
    
    // Set up request and response mocks
    mockRequest = {
      body: {},
      params: {},
      user: {
        id: 123,
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser'
      }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;
    
    await getUserProfile(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'User not authenticated'
    });
  });

  it('should return 404 if user is not found in database', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [],
      rowCount: 0
    });
    
    await getUserProfile(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT id, name, username, email, bio, avatar_url, created_at, updated_at FROM users WHERE id = $1',
      [123]
    );
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'User not found'
    });
  });

  it('should successfully return user profile', async () => {
    const mockUserProfile = {
      id: 123,
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      bio: 'Test bio',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z'
    };
    
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [mockUserProfile],
      rowCount: 1
    });
    
    await getUserProfile(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT id, name, username, email, bio, avatar_url, created_at, updated_at FROM users WHERE id = $1',
      [123]
    );
    expect(mockResponse.json).toHaveBeenCalledWith(mockUserProfile);
  });

  it('should handle database errors', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
    
    await getUserProfile(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Server error'
    });
  });
}); 