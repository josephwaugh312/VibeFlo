import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { User } from '../types';

// Extend the Request type to include user
interface AuthRequest extends Request {
  user?: User;
}

/**
 * Middleware to protect routes requiring authentication
 */
export const protect = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
    // If there's an error from Passport or JWT verification
    if (err) {
      const statusCode = err.statusCode || 500;
      const errorMessage = err.message || 'Authentication error';
      const errorCode = err.code || 'AUTH_ERROR';
      
      console.log(`Authentication error [${errorCode}]: ${errorMessage}`);
      
      // Create or enhance the error object
      const enhancedError: any = new Error(errorMessage);
      enhancedError.statusCode = statusCode;
      enhancedError.code = errorCode;
      enhancedError.originalError = err;
      
      return next(enhancedError);
    }

    // If no user was found or token was invalid
    if (!user) {
      // Get authorization header to check if token was provided
      const authHeader = req.headers.authorization || '';
      const hasToken = authHeader.startsWith('Bearer ');
      
      const error: any = new Error(
        hasToken 
          ? 'Invalid authentication token'
          : 'No authentication token provided'
      );
      error.statusCode = 401;
      error.code = hasToken ? 'INVALID_TOKEN' : 'MISSING_TOKEN';
      
      console.log(`Authentication failed: ${error.code} - ${error.message}`);
      return next(error);
    }

    // Authentication successful
    (req as AuthRequest).user = user;
    next();
  })(req, res, next);
};

/**
 * Optional authentication - will set user if token is valid but won't block the request if not
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
    if (err) {
      // Log the error but don't block the request
      console.log(`Optional auth error: ${err.message}`);
    }
    
    if (user) {
      (req as AuthRequest).user = user;
    }
    next();
  })(req, res, next);
}; 