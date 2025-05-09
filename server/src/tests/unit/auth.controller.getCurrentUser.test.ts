import { Request, Response } from 'express';
import { getCurrentUser } from '../../controllers/auth.controller';
import { testControllerWrapper } from '../../utils/testWrappers';
import { TestUser } from '../../types';

// Mock the database pool
jest.mock('../../config/db', () => ({
  query: jest.fn(),
}));

describe('Auth Controller - Get Current User', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockPool: any;
  let wrappedGetCurrentUser: any;

  beforeEach(() => {
    mockRequest = {
      user: {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User'
      } as TestUser,
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    mockPool = require('../../config/db');
    mockPool.query.mockClear();
    mockPool.query.mockImplementation(() => Promise.resolve({
      rows: [
        {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          username: 'testuser',
          avatar_url: 'https://example.com/avatar.jpg',
          is_verified: true
        }
      ]
    }));

    wrappedGetCurrentUser = testControllerWrapper(getCurrentUser);
  });

  it('should return user data if user is authenticated', async () => {
    await wrappedGetCurrentUser(mockRequest as Request, mockResponse as Response);

    // Verify response
    expect(mockResponse.json).toHaveBeenCalledWith({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      avatarUrl: 'https://example.com/avatar.jpg',
      is_verified: true
    });

    // Verify the query
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT id, name, username, email'),
      [1]
    );
  });

  it('should return 401 if user is not authenticated', async () => {
    // Remove user from request
    mockRequest.user = undefined;

    await wrappedGetCurrentUser(mockRequest as Request, mockResponse as Response);

    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Not authenticated'
    });
  });

  it('should handle database errors gracefully', async () => {
    // Mock database error
    mockPool.query.mockRejectedValueOnce(new Error('Database error'));

    // Spy on console.error to prevent test output pollution
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Call the controller
    await wrappedGetCurrentUser(mockRequest as Request, mockResponse as Response);

    // Verify error response
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Server error'
    });

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
}); 