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
import { updateUserProfile } from '../../controllers/user.controller';
import pool from '../../config/db';

// Mock console to keep tests clean
console.error = jest.fn();
console.log = jest.fn();

describe('User Controller - updateUserProfile', () => {
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
    
    await updateUserProfile(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'User not authenticated'
    });
  });

  it('should return 400 if bio length exceeds 150 characters', async () => {
    mockRequest.body = {
      bio: 'a'.repeat(151)
    };
    
    await updateUserProfile(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Bio cannot exceed 150 characters'
    });
  });

  it('should return 400 if username format is invalid', async () => {
    mockRequest.body = {
      username: 'invalid-username!'
    };
    
    await updateUserProfile(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Username can only contain letters, numbers, and underscores'
    });
  });

  it('should return 400 if username is already taken', async () => {
    mockRequest.body = {
      username: 'existinguser'
    };
    
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 456, username: 'existinguser' }],
      rowCount: 1
    });
    
    await updateUserProfile(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Username is already taken'
    });
  });

  it('should return 400 if username length is less than 3 or greater than 20 characters', async () => {
    mockRequest.body = {
      username: 'ab'
    };
    
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [],
      rowCount: 0
    });
    
    await updateUserProfile(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Username must be 3-20 characters and can only contain letters, numbers, and underscores'
    });
  });

  it('should return 400 if email is already registered to another account', async () => {
    mockRequest.body = {
      email: 'existing@example.com'
    };
    
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 456, email: 'existing@example.com' }],
      rowCount: 1
    });
    
    await updateUserProfile(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Email is already registered to another account'
    });
  });

  it('should return 400 if email format is invalid', async () => {
    mockRequest.body = {
      email: 'invalid-email'
    };
    
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [],
      rowCount: 0
    });
    
    await updateUserProfile(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Please provide a valid email address'
    });
  });

  it('should successfully update user profile with all fields', async () => {
    mockRequest.body = {
      name: 'Updated Name',
      username: 'updateduser',
      email: 'updated@example.com',
      bio: 'This is an updated bio',
      avatarUrl: 'https://example.com/avatar.jpg'
    };
    
    // Mock username check
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [],
      rowCount: 0
    });
    
    // Mock email check
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [],
      rowCount: 0
    });
    
    // Mock update query
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{
        id: 123,
        name: 'Updated Name',
        username: 'updateduser',
        email: 'updated@example.com',
        bio: 'This is an updated bio',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z'
      }]
    });
    
    await updateUserProfile(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    // Verify query was called with correct parameters
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [
      'Updated Name',
      'updateduser',
      'updated@example.com',
      'This is an updated bio',
      'https://example.com/avatar.jpg',
      123
    ]);
    
    // Verify response
    expect(mockResponse.json).toHaveBeenCalledWith({
      id: 123,
      name: 'Updated Name',
      username: 'updateduser',
      email: 'updated@example.com',
      bio: 'This is an updated bio',
      avatarUrl: 'https://example.com/avatar.jpg',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z'
    });
  });

  it('should successfully update user profile with partial fields', async () => {
    mockRequest.body = {
      name: 'Updated Name',
      bio: 'This is an updated bio'
    };
    
    // Mock update query
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{
        id: 123,
        name: 'Updated Name',
        username: 'testuser',
        email: 'test@example.com',
        bio: 'This is an updated bio',
        avatar_url: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z'
      }]
    });
    
    await updateUserProfile(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    // Verify query was called with correct parameters
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [
      'Updated Name',
      undefined,
      undefined,
      'This is an updated bio',
      undefined,
      123
    ]);
    
    // Verify response
    expect(mockResponse.json).toHaveBeenCalledWith({
      id: 123,
      name: 'Updated Name',
      username: 'testuser',
      email: 'test@example.com',
      bio: 'This is an updated bio',
      avatarUrl: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z'
    });
  });
  
  it('should handle database errors', async () => {
    mockRequest.body = {
      name: 'Updated Name'
    };
    
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
    
    await updateUserProfile(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Server error'
    });
  });
}); 