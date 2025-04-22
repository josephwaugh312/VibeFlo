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
      return res.status(500).json({ message: 'Internal server error during authentication' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized - No valid token provided' });
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
    if (user) {
      (req as AuthRequest).user = user;
    }
    next();
  })(req, res, next);
}; 