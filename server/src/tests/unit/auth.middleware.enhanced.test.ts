import { Request, Response, NextFunction } from 'express';
import { isAuthenticated } from '../../middleware/auth.middleware';
import jwt from 'jsonwebtoken';
import db from '../../config/db';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

// Mock database
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

// Mock console.error to avoid output during tests
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Auth Middleware - isAuthenticated', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;
  
  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should return 401 when no authorization header is present', async () => {
    // Call the middleware
    await isAuthenticated(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify response methods were called
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      message: 'Authentication required. Please log in.' 
    });
    
    // Verify next was not called
    expect(nextFunction).not.toHaveBeenCalled();
    
    // Verify jwt.verify was not called
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header does not start with Bearer', async () => {
    // Set invalid authorization header
    mockRequest.headers = { authorization: 'Invalid token_format' };
    
    // Call the middleware
    await isAuthenticated(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify response methods were called
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      message: 'Authentication required. Please log in.' 
    });
    
    // Verify next was not called
    expect(nextFunction).not.toHaveBeenCalled();
    
    // Verify jwt.verify was not called
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  it('should return 401 when no token is provided after Bearer', async () => {
    // Set authorization header with no token
    mockRequest.headers = { authorization: 'Bearer ' };
    
    // Call the middleware
    await isAuthenticated(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify response methods were called
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      message: 'Authentication token missing. Please log in.' 
    });
    
    // Verify next was not called
    expect(nextFunction).not.toHaveBeenCalled();
    
    // Verify jwt.verify was not called
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  it('should return 401 when token verification fails with JsonWebTokenError', async () => {
    // Set up request with valid authorization header
    mockRequest.headers = { authorization: 'Bearer valid.token' };
    
    // Mock jwt.verify to throw JsonWebTokenError
    (jwt.verify as jest.Mock).mockImplementationOnce(() => {
      throw new jwt.JsonWebTokenError('invalid token');
    });
    
    // Call the middleware
    await isAuthenticated(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify jwt.verify was called with correct parameters
    expect(jwt.verify).toHaveBeenCalledWith(
      'valid.token',
      expect.any(String)
    );
    
    // Verify response methods were called
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      message: 'Invalid token. Please log in again.' 
    });
    
    // Verify next was not called
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 when token has expired', async () => {
    // Set up request with valid authorization header
    mockRequest.headers = { authorization: 'Bearer expired.token' };
    
    // Mock jwt.verify to throw TokenExpiredError
    (jwt.verify as jest.Mock).mockImplementationOnce(() => {
      const error = new jwt.JsonWebTokenError('jwt expired');
      error.name = 'TokenExpiredError';
      throw error;
    });
    
    // Call the middleware
    await isAuthenticated(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify jwt.verify was called with correct parameters
    expect(jwt.verify).toHaveBeenCalledWith(
      'expired.token',
      expect.any(String)
    );
    
    // Verify response methods were called
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      message: 'Invalid token. Please log in again.' 
    });
    
    // Verify next was not called
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 when user is not found in database', async () => {
    // Set up request with valid authorization header
    mockRequest.headers = { authorization: 'Bearer valid.token' };
    
    // Mock jwt.verify to return decoded token
    (jwt.verify as jest.Mock).mockReturnValueOnce({
      id: 'nonexistent-user-id',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    });
    
    // Mock database to return no user
    (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
    
    // Call the middleware
    await isAuthenticated(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify database query was called with correct parameters
    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE id = $1',
      ['nonexistent-user-id']
    );
    
    // Verify response methods were called
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      message: 'User not found. Please register or log in.' 
    });
    
    // Verify next was not called
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 500 when database query fails', async () => {
    // Set up request with valid authorization header
    mockRequest.headers = { authorization: 'Bearer valid.token' };
    
    // Mock jwt.verify to return decoded token
    (jwt.verify as jest.Mock).mockReturnValueOnce({
      id: 'valid-user-id',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    });
    
    // Mock database to throw error
    (db.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
    
    // Call the middleware
    await isAuthenticated(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify console.error was called
    expect(console.error).toHaveBeenCalledWith('Authentication error:', expect.any(Error));
    
    // Verify response methods were called
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      message: 'Server error during authentication.' 
    });
    
    // Verify next was not called
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next and set user on request when authentication succeeds', async () => {
    // Set up request with valid authorization header
    mockRequest.headers = { authorization: 'Bearer valid.token' };
    
    // Create a mock user
    const mockUser = {
      id: 'valid-user-id',
      username: 'testuser',
      email: 'test@example.com'
    };
    
    // Mock jwt.verify to return decoded token
    (jwt.verify as jest.Mock).mockReturnValueOnce({
      id: mockUser.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    });
    
    // Mock database to return user
    (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });
    
    // Call the middleware
    await isAuthenticated(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify database query was called with correct parameters
    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE id = $1',
      [mockUser.id]
    );
    
    // Verify user was set on request
    expect(mockRequest.user).toEqual(mockUser);
    
    // Verify next was called with no arguments
    expect(nextFunction).toHaveBeenCalledWith();
    
    // Verify response methods were not called
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });
}); 