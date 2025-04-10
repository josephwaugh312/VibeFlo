import { Request, Response } from 'express';
import pool from '../config/db';
import { User } from '../types';

// Extend the Request type to include user
interface AuthRequest extends Request {
  user?: User;
}

/**
 * Get current user profile
 */
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get user profile
    const userProfile = await pool.query('SELECT id, name, username, email, profile_picture FROM users WHERE id = $1', [userId]);
    
    if (userProfile.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(userProfile.rows[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { name, username, profile_picture } = req.body;
    
    // If updating username, check if it's unique
    if (username) {
      const usernameCheck = await pool.query('SELECT * FROM users WHERE username = $1 AND id != $2', [username, userId]);
      
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      
      // Validate username format
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return res.status(400).json({ 
          message: 'Username must be 3-20 characters and can only contain letters, numbers, and underscores' 
        });
      }
    }

    // Update user profile
    const updateQuery = `
      UPDATE users
      SET 
        name = COALESCE($1, name),
        username = COALESCE($2, username),
        profile_picture = COALESCE($3, profile_picture),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, username, email, profile_picture
    `;
    
    const updatedProfile = await pool.query(updateQuery, [name, username, profile_picture, userId]);
    
    res.json(updatedProfile.rows[0]);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 