import { Request, Response, NextFunction } from 'express';
import { User } from '../types';

/**
 * Middleware to check if a user's email is verified
 * This should be used after the authentication middleware
 */
export const isVerified = (req: Request, res: Response, next: NextFunction) => {
  // First check if user is authenticated and attached to request
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required. Please log in.',
      code: 'AUTH_REQUIRED'
    });
  }

  // Check if user's email is verified
  const user = req.user as User;
  if (!user.is_verified) {
    return res.status(403).json({ 
      message: 'Email verification required. Please verify your email to access this feature.',
      code: 'EMAIL_VERIFICATION_REQUIRED'
    });
  }

  // User is verified, proceed to the next middleware
  next();
}; 