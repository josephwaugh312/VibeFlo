import { Request, Response } from 'express';
import { TestUser } from '../../types';

// Import the controller
const { getCurrentUser } = require('../../controllers/auth.controller.simple.js');

// Mock the database
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

describe('Auth Controller - Simple GetCurrentUser', () => {
  let mockRequest;
  let mockResponse;
  let mockDb;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    mockDb = require('../../config/db');
    
    // Create mock request and response
    mockRequest = {
      user: {
        id: 1,
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com'
      } as TestUser,
      app: {
        locals: {
          db: mockDb
        }
      }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('should return 401 if user is not authenticated', async () => {
    // Set up request with no user
    mockRequest.user = undefined;
    
    // Call the controller
    await getCurrentUser(mockRequest, mockResponse);
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'User not authenticated'
    });
  });

  it('should handle database errors', async () => {
    // Set up request with a user that causes an error
    mockRequest.user = {
      id: 1,
      errorCase: true
    } as TestUser;
    
    // Mock database error
    mockDb.query.mockRejectedValueOnce(new Error('Database error'));
    
    // Spy on console.error to prevent test output pollution
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Call the controller
    await getCurrentUser(mockRequest, mockResponse);
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Server error'
    });
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('should return user data with transformed isVerified field', async () => {
    // Set up request with a verified user
    mockRequest.user = {
      id: 1,
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      is_verified: true
    } as TestUser;
    
    // Mock database response
    mockDb.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        is_verified: true,
        created_at: new Date()
      }]
    });
    
    // Call the controller
    await getCurrentUser(mockRequest, mockResponse);
    
    // Verify response
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        isVerified: true
      })
    );
    
    // Verify the original field is not present
    const responseData = mockResponse.json.mock.calls[0][0];
    expect(responseData).not.toHaveProperty('is_verified');
  });

  it('should handle user with additional fields', async () => {
    // Set up request with user having additional fields
    mockRequest.user = {
      id: 1,
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      is_verified: true,
      other_field: 'value'
    } as any;
    
    // Mock database response
    mockDb.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        is_verified: true,
        created_at: new Date(),
        additional_field: 'should be kept'
      }]
    });
    
    // Call the controller
    await getCurrentUser(mockRequest, mockResponse);
    
    // Verify response includes all fields from database
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        isVerified: true,
        additional_field: 'should be kept'
      })
    );
  });
}); 