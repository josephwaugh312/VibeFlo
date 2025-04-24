import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

/**
 * Middleware to handle database-specific errors
 * This middleware should be applied before the main error middleware
 */
export const databaseErrorMiddleware = (
  err: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // Skip if this isn't a database error
  if (!err.code || typeof err.code !== 'string') {
    return next(err);
  }

  // PostgreSQL error codes
  switch (err.code) {
    // No such table
    case '42P01':
      return next(
        AppError.internal(
          'Database schema error: Missing table', 
          'DB_MISSING_TABLE', 
          err
        )
      );
    
    // No such column
    case '42703':
      return next(
        AppError.internal(
          'Database schema error: Missing column', 
          'DB_MISSING_COLUMN', 
          err
        )
      );
    
    // Unique violation
    case '23505':
      return next(
        AppError.conflict(
          err.detail || 'A record with this value already exists', 
          'DB_UNIQUE_VIOLATION', 
          err
        )
      );
    
    // Foreign key violation
    case '23503':
      return next(
        AppError.badRequest(
          err.detail || 'Foreign key constraint violation', 
          'DB_FOREIGN_KEY_VIOLATION', 
          err
        )
      );
    
    // Not null violation
    case '23502':
      return next(
        AppError.badRequest(
          `Required field missing: ${err.column || 'unknown'}`, 
          'DB_NOT_NULL_VIOLATION', 
          err
        )
      );
      
    // Syntax error
    case '42601':
      return next(
        AppError.internal(
          'Database query syntax error', 
          'DB_SYNTAX_ERROR', 
          err
        )
      );
      
    // Connection failure
    case 'ECONNREFUSED':
    case '08006':
    case '08001':
      return next(
        AppError.serviceUnavailable(
          'Database connection failed', 
          'DB_CONNECTION_ERROR', 
          err
        )
      );
      
    default:
      // Pass other database errors to the next handler
      return next(err);
  }
}; 