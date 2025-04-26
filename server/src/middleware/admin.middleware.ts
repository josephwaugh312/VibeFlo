import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { User } from '../types';

interface AuthRequest extends Request {
  user?: User;
}

/**
 * Middleware to check if the user is an admin
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated and attached to request
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }

  // Check if user has admin role
  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }

  // User is an admin, proceed
  next();
}; 