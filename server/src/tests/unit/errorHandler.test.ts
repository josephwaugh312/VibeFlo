import { Request, Response, NextFunction } from 'express';
import { handleAsync, errorMiddleware } from '../../utils/errorHandler';
import { AppError } from '../../utils/errors';

describe('Error Handler Utilities', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      path: '/test-path'
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('handleAsync', () => {
    it('should successfully call the handler function', async () => {
      // Create a mock controller function
      const mockController = jest.fn().mockImplementation(async (req, res, next) => {
        res.status(200).json({ success: true });
      });
      
      // Wrap it with handleAsync
      const wrappedController = handleAsync(mockController);
      
      // Create mock request, response, and next
      const req = {} as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;
      const next = jest.fn();
      
      // Call the wrapped controller
      await wrappedController(req, res, next);
      
      // Verify the controller was called
      expect(mockController).toHaveBeenCalledWith(req, res, next);
      
      // Verify the response methods were called as expected
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
      
      // Verify next was not called
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if handler throws', async () => {
      // Mock console.error to avoid noise in test output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create mock request, response, and next
      const mockReq = {};
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();
      const mockError = new Error('Test error');
      
      // Create a handler function that throws an error
      const handler = async () => {
        throw mockError;
      };
      
      // Apply handleAsync to the handler
      const wrappedHandler = handleAsync(handler);
      
      // Call the wrapped handler
      await wrappedHandler(mockReq as any, mockRes as any, mockNext);
      
      // Verify that next was called with the error
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      
      // Expect the actual error message format
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error in handleAsync:", 
        mockError
      );
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('errorMiddleware', () => {
    it('should format and return error responses with status code from error', () => {
      // Create a mock error with statusCode
      const mockError = new AppError('Bad request', 400);
      
      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Call the error middleware
      errorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Bad request',
        code: 'SERVER_ERROR',
        path: '/test-path'
      }));
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it('should use default status code 500 if not provided in error', () => {
      // Create a mock error without statusCode
      const mockError = new AppError('Internal error');
      
      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Call the error middleware
      errorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Internal error',
        code: 'SERVER_ERROR',
        path: '/test-path'
      }));
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it('should use default message if not provided in error', () => {
      // Create an error without message
      const mockError = new Error();
      
      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Call the error middleware
      errorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Internal Server Error',
        code: 'SERVER_ERROR',
        path: '/test-path'
      }));
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it('should include stack trace when not in production', () => {
      // Store original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set NODE_ENV to development
      process.env.NODE_ENV = 'development';
      
      // Create a mock error with stack
      const mockError = new Error('Development error');
      mockError.stack = 'Error stack trace';
      
      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Call the error middleware
      errorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Development error',
        stack: 'Error stack trace',
        code: 'SERVER_ERROR',
        path: '/test-path'
      }));
      
      // Restore NODE_ENV and console.error
      process.env.NODE_ENV = originalNodeEnv;
      consoleErrorSpy.mockRestore();
    });
  });
}); 