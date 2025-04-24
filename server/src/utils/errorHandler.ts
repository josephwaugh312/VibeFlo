import { Request, Response, NextFunction } from 'express';

// Type for async route handlers
type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

// Higher order function to wrap async route handlers for error handling
export const handleAsync = (fn: AsyncRouteHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error('Uncaught error in route handler:', error);
      next(error);
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