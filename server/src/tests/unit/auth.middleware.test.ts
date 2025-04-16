import { Request, Response } from 'express';
import { protect, optionalAuth } from '../../middleware/auth.middleware';
import passport from 'passport';

// Mock passport
jest.mock('passport', () => ({
  authenticate: jest.fn((strategy, options, callback) => {
    return (req: any, res: any, next: any) => {
      callback(null, null);
    };
  })
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;
  
  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    nextFunction = jest.fn();
  });

  describe('protect middleware', () => {
    it('should continue if authentication is successful', () => {
      // Set up passport.authenticate to return a user
      (passport.authenticate as jest.Mock).mockImplementationOnce((strategy, options, callback) => {
        return (req: any, res: any, next: any) => {
          callback(null, { id: 1, username: 'testuser' });
          return callback;
        };
      });

      protect(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(passport.authenticate).toHaveBeenCalledWith('jwt', { session: false }, expect.any(Function));
      expect(mockRequest.user).toEqual({ id: 1, username: 'testuser' });
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no user is found', () => {
      // Set up passport.authenticate to not return a user
      (passport.authenticate as jest.Mock).mockImplementationOnce((strategy, options, callback) => {
        return (req: any, res: any, next: any) => {
          callback(null, null);
          return callback;
        };
      });

      protect(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(passport.authenticate).toHaveBeenCalledWith('jwt', { session: false }, expect.any(Function));
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unauthorized - No valid token provided' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 500 if authentication throws an error', () => {
      // Set up passport.authenticate to throw an error
      (passport.authenticate as jest.Mock).mockImplementationOnce((strategy, options, callback) => {
        return (req: any, res: any, next: any) => {
          callback(new Error('Auth error'), null);
          return callback;
        };
      });

      protect(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(passport.authenticate).toHaveBeenCalledWith('jwt', { session: false }, expect.any(Function));
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error during authentication' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth middleware', () => {
    it('should set user on request if authentication is successful', () => {
      // Set up passport.authenticate to return a user
      (passport.authenticate as jest.Mock).mockImplementationOnce((strategy, options, callback) => {
        return (req: any, res: any, next: any) => {
          callback(null, { id: 1, username: 'testuser' });
          return callback;
        };
      });

      optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(passport.authenticate).toHaveBeenCalledWith('jwt', { session: false }, expect.any(Function));
      expect(mockRequest.user).toEqual({ id: 1, username: 'testuser' });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should continue without setting user if no user is found', () => {
      // Set up passport.authenticate to not return a user
      (passport.authenticate as jest.Mock).mockImplementationOnce((strategy, options, callback) => {
        return (req: any, res: any, next: any) => {
          callback(null, null);
          return callback;
        };
      });

      optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(passport.authenticate).toHaveBeenCalledWith('jwt', { session: false }, expect.any(Function));
      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should continue even if authentication throws an error', () => {
      // Set up passport.authenticate to throw an error
      (passport.authenticate as jest.Mock).mockImplementationOnce((strategy, options, callback) => {
        return (req: any, res: any, next: any) => {
          callback(new Error('Auth error'), null);
          return callback;
        };
      });

      optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(passport.authenticate).toHaveBeenCalledWith('jwt', { session: false }, expect.any(Function));
      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });
  });
}); 