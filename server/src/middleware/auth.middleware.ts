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
    if (err) {
      // Create an error with status code for the error middleware to handle
      const error: any = new Error('Internal server error during authentication');
      error.statusCode = 500;
      return next(error);
    }

    if (!user) {
      // Create an error with status code for the error middleware to handle
      const error: any = new Error('Unauthorized - No valid token provided');
      error.statusCode = 401;
      return next(error);
    }

    // Set the user object on the request
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
      console.error('Error in optional authentication:', err);
    }
    
    if (user) {
      (req as AuthRequest).user = user;
    }
    next();
  })(req, res, next);
}; 