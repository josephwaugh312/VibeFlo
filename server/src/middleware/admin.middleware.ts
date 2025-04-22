import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { User } from '../types';

interface AuthRequest extends Request {
  user?: User;
}

/**
 * Middleware to check if the user is an admin
 */
export const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // First check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Check if user has admin privileges
    const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.rows[0];
    
    if (!user.is_admin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    // User is an admin, proceed to the next middleware
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error checking admin privileges' });
  }
}; 