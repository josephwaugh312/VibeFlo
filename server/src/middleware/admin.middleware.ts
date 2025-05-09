import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { User } from '../types';

interface AuthRequest extends Request {
  user?: User;
}

/**
 * Middleware to check if the user is an admin
 */
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated and attached to request
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Query the database to check if user is an admin
    const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    
    // Check if user exists
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has admin role
    if (!result.rows[0].is_admin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    // User is an admin, proceed
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ 
      message: 'Server error checking admin privileges' 
    });
  }
}; 