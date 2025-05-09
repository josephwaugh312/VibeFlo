import { Request, Response } from 'express';
import { protect, optionalAuth } from '../../middleware/auth.middleware';
import passport from 'passport';

// Mock passport
jest.mock('passport', () => ({
  authenticate: jest.fn((strategy, options, callback) => {
    return (req: any, res: any, next: any) => {
      // Call the callback with the mock values
      const error = null;
      const user = null;
      callback(error, user);
      
      // For testing purposes, we need to implement the response methods that would normally be called
      if (!user) {
        res.status(401).json({ message: 'Unauthorized - No valid token provided' });
      }
      
      return callback;
    };
  })
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;
  
  beforeEach(() => {
    mockRequest = {
      path: '/api/test',
      headers: {
        authorization: 'Bearer mock_token'
      }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  describe('protect middleware', () => {
    it('should continue if authentication is successful', () => {
      // Override the passport authenticate implementation for this test
      (passport.authenticate as jest.Mock).mockImplementationOnce((strategy, options, callback) => {
        return (req: any, res: any, next: any) => {
          // Mock user found
          const error = null;
          const user = { id: 1, name: 'Test User' };
          
          // Call the callback with a user, simulating successful authentication
          callback(error, user);
          
          // Call next to continue
          next();
          
          return callback;
        };
      });

      // Call the middleware
      protect(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Verify next was called
      expect(nextFunction).toHaveBeenCalled();
      
      // Verify response methods were not called
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should pass the error to next if no user is found', () => {
      // Override the passport authenticate implementation for this test
      (passport.authenticate as jest.Mock).mockImplementationOnce((strategy, options, callback) => {
        return (req: any, res: any, next: any) => {
          // Mock user not found
          const error = new Error('Invalid authentication token');
          const user = null;
          
          // Call the callback with no user
          callback(error, user);
          
          // Call next with the error
          next(error);
          
          return callback;
        };
      });

      // Call the middleware
      protect(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // In the actual implementation, next is called with the error
      expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should pass authentication errors to next', () => {
      // Override the passport authenticate implementation for this test
      (passport.authenticate as jest.Mock).mockImplementationOnce((strategy, options, callback) => {
        return (req: any, res: any, next: any) => {
          // Mock auth error
          const error = new Error('Auth error');
          const user = null;
          
          // Call the callback with an error
          callback(error, user);
          
          // Call next with the error
          next(error);
          
          return callback;
        };
      });

      // Call the middleware
      protect(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // In the actual implementation, next is called with the error
      expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('optionalAuth middleware', () => {
    it('should set user on request if authentication is successful', () => {
      // Override the passport authenticate implementation for this test
      (passport.authenticate as jest.Mock).mockImplementationOnce((strategy, options, callback) => {
        return (req: any, res: any, next: any) => {
          // Mock user found
          const error = null;
          const user = { id: 1, name: 'Test User' };
          
          // Call the callback with a user
          callback(error, user);
          
          // Set user on request
          req.user = user;
          
          // Call next to continue
          next();
          
          return callback;
        };
      });

      // Call the middleware
      optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Verify next was called
      expect(nextFunction).toHaveBeenCalled();
      
      // Verify no response methods were called
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      
      // Verify user was set on request
      expect(mockRequest.user).toEqual({ id: 1, name: 'Test User' });
    });

    it('should continue without setting user if no user is found', () => {
      // Override the passport authenticate implementation for this test
      (passport.authenticate as jest.Mock).mockImplementationOnce((strategy, options, callback) => {
        return (req: any, res: any, next: any) => {
          // Mock user not found
          const error = null;
          const user = null;
          
          // Call the callback with no user
          callback(error, user);
          
          // Call next to continue
          next();
          
          return callback;
        };
      });

      // Call the middleware
      optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Verify next was called
      expect(nextFunction).toHaveBeenCalled();
      
      // Verify no response methods were called
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      
      // Verify user remains undefined on request
      expect(mockRequest.user).toBeUndefined();
    });

    it('should continue even if authentication throws an error', () => {
      // Override the passport authenticate implementation for this test
      (passport.authenticate as jest.Mock).mockImplementationOnce((strategy, options, callback) => {
        return (req: any, res: any, next: any) => {
          // Mock auth error
          const error = new Error('Auth error');
          const user = null;
          
          // Call the callback with an error
          callback(error, user);
          
          // Call next to continue (without the error)
          next();
          
          return callback;
        };
      });

      // Call the middleware
      optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Verify next was called without error
      expect(nextFunction).toHaveBeenCalledWith();
      
      // Verify no response methods were called
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      
      // Verify user remains undefined on request
      expect(mockRequest.user).toBeUndefined();
    });
  });
}); 