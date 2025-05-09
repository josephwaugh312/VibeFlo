import { Request, Response, NextFunction } from 'express';
import { databaseErrorMiddleware } from '../../middleware/error.middleware';
import { AppError } from '../../utils/errors';

describe('Database Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;
  
  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    nextFunction = jest.fn();
  });

  it('should pass non-database errors to next middleware', () => {
    // Create a regular error
    const error = new Error('Regular error');
    
    // Call the middleware
    databaseErrorMiddleware(error, mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify next was called with original error
    expect(nextFunction).toHaveBeenCalledWith(error);
  });

  it('should pass non-string code errors to next middleware', () => {
    // Create an error with a non-string code
    const error = new Error('Error with numeric code');
    (error as any).code = 123;
    
    // Call the middleware
    databaseErrorMiddleware(error, mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify next was called with original error
    expect(nextFunction).toHaveBeenCalledWith(error);
  });

  it('should handle missing table (42P01) database error', () => {
    // Create a database error with code 42P01
    const error = new Error('Missing table error');
    (error as any).code = '42P01';
    
    // Call the middleware
    databaseErrorMiddleware(error, mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify next was called with an AppError
    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    
    // Verify error properties
    const appError = nextFunction.mock.calls[0][0];
    expect(appError.message).toContain('Missing table');
    expect(appError.code).toBe('DB_MISSING_TABLE');
    expect(appError.statusCode).toBe(500); // Internal server error
  });

  it('should handle missing column (42703) database error', () => {
    // Create a database error with code 42703
    const error = new Error('Missing column error');
    (error as any).code = '42703';
    
    // Call the middleware
    databaseErrorMiddleware(error, mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify next was called with an AppError
    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    
    // Verify error properties
    const appError = nextFunction.mock.calls[0][0];
    expect(appError.message).toContain('Missing column');
    expect(appError.code).toBe('DB_MISSING_COLUMN');
    expect(appError.statusCode).toBe(500); // Internal server error
  });

  it('should handle unique violation (23505) database error', () => {
    // Create a database error with code 23505
    const error = new Error('Unique violation error');
    (error as any).code = '23505';
    (error as any).detail = 'Key (email)=(test@example.com) already exists';
    
    // Call the middleware
    databaseErrorMiddleware(error, mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify next was called with an AppError
    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    
    // Verify error properties
    const appError = nextFunction.mock.calls[0][0];
    expect(appError.message).toBe('Key (email)=(test@example.com) already exists');
    expect(appError.code).toBe('DB_UNIQUE_VIOLATION');
    expect(appError.statusCode).toBe(409); // Conflict
  });

  it('should handle foreign key violation (23503) database error', () => {
    // Create a database error with code 23503
    const error = new Error('Foreign key violation error');
    (error as any).code = '23503';
    (error as any).detail = 'Key (user_id)=(999) is not present in table "users"';
    
    // Call the middleware
    databaseErrorMiddleware(error, mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify next was called with an AppError
    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    
    // Verify error properties
    const appError = nextFunction.mock.calls[0][0];
    expect(appError.message).toBe('Key (user_id)=(999) is not present in table "users"');
    expect(appError.code).toBe('DB_FOREIGN_KEY_VIOLATION');
    expect(appError.statusCode).toBe(400); // Bad request
  });

  it('should handle not null violation (23502) database error', () => {
    // Create a database error with code 23502
    const error = new Error('Not null violation error');
    (error as any).code = '23502';
    (error as any).column = 'email';
    
    // Call the middleware
    databaseErrorMiddleware(error, mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify next was called with an AppError
    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    
    // Verify error properties
    const appError = nextFunction.mock.calls[0][0];
    expect(appError.message).toBe('Required field missing: email');
    expect(appError.code).toBe('DB_NOT_NULL_VIOLATION');
    expect(appError.statusCode).toBe(400); // Bad request
  });

  it('should handle database syntax error (42601)', () => {
    // Create a database error with code 42601
    const error = new Error('Syntax error');
    (error as any).code = '42601';
    
    // Call the middleware
    databaseErrorMiddleware(error, mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify next was called with an AppError
    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    
    // Verify error properties
    const appError = nextFunction.mock.calls[0][0];
    expect(appError.message).toContain('Database query syntax error');
    expect(appError.code).toBe('DB_SYNTAX_ERROR');
    expect(appError.statusCode).toBe(500); // Internal server error
  });

  it('should handle database connection errors', () => {
    // Test for different connection error codes
    const connectionErrorCodes = ['ECONNREFUSED', '08006', '08001'];
    
    for (const code of connectionErrorCodes) {
      // Reset the mock
      nextFunction.mockReset();
      
      // Create a database error with connection error code
      const error = new Error('Connection error');
      (error as any).code = code;
      
      // Call the middleware
      databaseErrorMiddleware(error, mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Verify next was called with an AppError
      expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
      
      // Verify error properties
      const appError = nextFunction.mock.calls[0][0];
      expect(appError.message).toContain('Database connection failed');
      expect(appError.code).toBe('DB_CONNECTION_ERROR');
      expect(appError.statusCode).toBe(503); // Service unavailable
    }
  });

  it('should pass unknown database errors to next middleware', () => {
    // Create a database error with unknown code
    const error = new Error('Unknown database error');
    (error as any).code = 'UNKNOWN_CODE';
    
    // Call the middleware
    databaseErrorMiddleware(error, mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify next was called with original error
    expect(nextFunction).toHaveBeenCalledWith(error);
  });
}); 