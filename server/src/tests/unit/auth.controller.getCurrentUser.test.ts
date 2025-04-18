import { Request, Response } from 'express';
// @ts-ignore - Suppress TypeScript errors for import issues
import { getCurrentUser } from '../../controllers/auth.controller';
// @ts-ignore - Suppress TypeScript errors for import issues
import pool from '../../config/db';
import { User } from '../../types';

// Mock the database pool
jest.mock('../../config/db', () => {
  return {
    query: jest.fn()
  };
});

describe('getCurrentUser Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock response with spy functions
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Mock console.error to prevent noise in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  it('should return 401 if not authenticated', async () => {
    // Setup request with no user
    mockRequest = {};
    
    // Call the controller
    await getCurrentUser(mockRequest as any, mockResponse as Response);
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
  });
  
  it('should return user data when authenticated', async () => {
    // Setup request with authenticated user
    mockRequest = {
      user: { 
        id: 1, 
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser'
      } as User
    };
    
    // Mock database to return user data
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{
        id: 1,
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        bio: 'Test bio',
        avatar_url: 'avatar.jpg',
        created_at: new Date(),
        updated_at: new Date()
      }],
      rowCount: 1
    });
    
    // Call the controller
    await getCurrentUser(mockRequest as any, mockResponse as Response);
    
    // Verify response
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    }));
    
    // Verify database was queried
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT id, name, username, email, bio, avatar_url, created_at, updated_at'),
      [1]
    );
  });
  
  it('should return 404 if user not found', async () => {
    // Setup request with authenticated user
    mockRequest = {
      user: { 
        id: 999, 
        email: 'nonexistent@example.com',
        name: 'Nonexistent User',
        username: 'nonexistent'
      } as User
    };
    
    // Mock database to return no user
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [],
      rowCount: 0
    });
    
    // Call the controller
    await getCurrentUser(mockRequest as any, mockResponse as Response);
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
  });
  
  it('should return 500 if database error occurs', async () => {
    // Setup request with authenticated user
    mockRequest = {
      user: { 
        id: 1, 
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser'
      } as User
    };
    
    // Mock database to throw error
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
    
    // Call the controller
    await getCurrentUser(mockRequest as any, mockResponse as Response);
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error retrieving user data' });
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalled();
  });
}); 