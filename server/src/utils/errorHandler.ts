import { Request, Response, NextFunction } from 'express';
import { AppError } from './errors';

// Type for async route handlers
type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

// Higher order function to wrap async route handlers for error handling
export const handleAsync = (fn: AsyncRouteHandler) => {
  return async (req: Request, res: Response, next: NextFunction = () => {}) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error('Error in handleAsync:', error);
      
      // Send a friendly error to the client if a response hasn't been sent yet
      if (!res.headersSent) {
        res.status(500).json({
          message: 'Server error',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      
      // Pass to error handling middleware if it exists
      if (next) next(error);
    }
  };
};

// Global error handler middleware
export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Determine if this is an AppError or a regular Error
  const isAppError = err instanceof AppError;
  
  // Extract error details
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errorCode = err.code || 'SERVER_ERROR';
  
  // Log the error with context
  console.error(`[ERROR] ${statusCode} ${errorCode}: ${message}`);
  if (err.stack) {
    console.error(`Stack trace: ${err.stack}`);
  }
  
  // Build error response
  const errorResponse = {
    error: message,
    code: errorCode,
    path: req.path,
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: err.stack,
      originalError: err.originalError ? {
        message: err.originalError.message,
        name: err.originalError.name
      } : undefined
    })
  };
  
  // If this is an authentication error, add specific info to help debugging
  if (statusCode === 401 || statusCode === 403) {
    console.log(`Authentication error details:
      Path: ${req.path}
      Method: ${req.method}
      Headers: ${JSON.stringify(req.headers.authorization ? 
        { ...req.headers, authorization: 'Bearer [redacted]' } : 
        req.headers)}
    `);
  }
  
  res.status(statusCode).json(errorResponse);
};

// Helper function to convert standard errors to AppErrors
export const convertToAppError = (err: Error, statusCode = 500, errorCode = 'SERVER_ERROR'): AppError => {
  // If it's already an AppError, return it
  if (err instanceof AppError) {
    return err;
  }
  
  // Handle common error types and convert them to AppErrors
  if (err.name === 'ValidationError') {
    return AppError.validation(err.message, 'VALIDATION_ERROR', err);
  }
  
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return AppError.unauthorized(err.message, 'AUTH_ERROR', err);
  }
  
  // Default case: convert to a generic AppError
  return new AppError(err.message, statusCode, errorCode, err);
};

/**
 * Custom error types
 */
export class ValidationError extends Error {
  status: number;
  
  constructor(message: string, status: number = 400) {
    super(message);
    this.name = 'ValidationError';
    this.status = status;
  }
}

export class AuthenticationError extends Error {
  status: number;
  
  constructor(message: string, status: number = 401) {
    super(message);
    this.name = 'AuthenticationError';
    this.status = status;
  }
}

export class AuthorizationError extends Error {
  status: number;
  
  constructor(message: string, status: number = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.status = status;
  }
}

export class ResourceNotFoundError extends Error {
  status: number;
  
  constructor(message: string, status: number = 404) {
    super(message);
    this.name = 'ResourceNotFoundError';
    this.status = status;
  }
}

export class ServerError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ServerError';
    this.status = status;
  }
} 