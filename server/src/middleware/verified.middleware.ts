import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import pool from '../config/db';

/**
 * Middleware to check if a user's email is verified
 * This will prevent access to protected routes if email is not verified
 * Currently bypassing verification check for all environments
 */
export const verifiedMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Bypass verification check for all environments temporarily
  // TEMPORARY: Always bypass verification to fix login issues
  console.log('Verification check bypassed - TEMPORARY FIX');
  return next();

  /* Original verification logic - commented out temporarily
  // Bypass verification check in development mode
  if (process.env.NODE_ENV !== 'production') {
    console.log('Development mode: Bypassing email verification check');
    return next();
  }

  if (!req.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Check if the user's email is verified using pool instead of db
    const result = await pool.query(
      'SELECT is_verified FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    
    // If email is not verified, prevent access to protected routes
    if (!user.is_verified) {
      return res.status(403).json({ 
        message: 'Email not verified',
        verificationRequired: true 
      });
    }

    // Email is verified, proceed to the next middleware/route handler
    next();
  } catch (error) {
    console.error('Error in verified middleware:', error);
    return res.status(500).json({ message: 'Server error' });
  }
  */
}; 