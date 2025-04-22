import { Request, Response, NextFunction } from 'express';
import { handleAsync, errorMiddleware } from '../../utils/errorHandler';

describe('Error Handler Utilities', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('handleAsync', () => {
    it('should successfully call the handler function', async () => {
      // Create a mock route handler that resolves successfully
      const mockHandler = jest.fn().mockResolvedValue('success');
      
      // Wrap the handler with handleAsync
      const wrappedHandler = handleAsync(mockHandler);
      
      // Call the wrapped handler
      await wrappedHandler(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if handler throws', async () => {
      // Create a mock error
      const mockError = new Error('Test error');
      
      // Create a mock route handler that rejects with an error
      const mockHandler = jest.fn().mockRejectedValue(mockError);
      
      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Wrap the handler with handleAsync
      const wrappedHandler = handleAsync(mockHandler);
      
      // Call the wrapped handler
      await wrappedHandler(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Uncaught error in route handler:', mockError);
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('errorMiddleware', () => {
    it('should format and return error responses with status code from error', () => {
      // Create a mock error with statusCode
      const mockError = {
        statusCode: 400,
        message: 'Bad request'
      };
      
      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Call the error middleware
      errorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Bad request',
        stack: undefined
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Global error handler:', mockError);
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it('should use default status code 500 if not provided in error', () => {
      // Create a mock error without statusCode
      const mockError = {
        message: 'Internal error'
      };
      
      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Call the error middleware
      errorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal error',
        stack: undefined
      });
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it('should use default message if not provided in error', () => {
      // Create a mock error without message
      const mockError = {};
      
      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Call the error middleware
      errorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        stack: undefined
      });
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it('should include stack trace when not in production', () => {
      // Store original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set NODE_ENV to development
      process.env.NODE_ENV = 'development';
      
      // Create a mock error with stack
      const mockError = {
        message: 'Development error',
        stack: 'Error stack trace'
      };
      
      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Call the error middleware
      errorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Development error',
        stack: 'Error stack trace'
      });
      
      // Restore NODE_ENV and console.error
      process.env.NODE_ENV = originalNodeEnv;
      consoleErrorSpy.mockRestore();
    });
  });
}); 