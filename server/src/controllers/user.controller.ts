import { Request, Response } from 'express';
import pool from '../config/db';
import { User } from '../types';
import bcrypt from 'bcrypt';
import emailService from '../services/email.service';

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
    const userProfile = await pool.query('SELECT id, name, username, email, bio, avatar_url, created_at, updated_at FROM users WHERE id = $1', [userId]);
    
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

    const { name, username, email, bio, avatarUrl } = req.body;
    
    // Validate bio length
    if (bio && bio.length > 150) {
      return res.status(400).json({ message: 'Bio cannot exceed 150 characters' });
    }
    
    // Username format validation
    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });
    }
    
    console.log('Server: Updating profile for user', userId, 'with data:', { name, username, email, bio, avatarUrl });
    
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

    // If updating email, check if it's unique
    if (email) {
      const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1 AND id != $2', [email, userId]);
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Email is already registered to another account' });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
      }
    }

    // Update user profile
    const updateQuery = `
      UPDATE users
      SET 
        name = COALESCE($1, name),
        username = COALESCE($2, username),
        email = COALESCE($3, email),
        bio = COALESCE($4, bio),
        avatar_url = COALESCE($5, avatar_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, name, username, email, bio, avatar_url, created_at, updated_at
    `;
    
    const updateParams = [name, username, email, bio, avatarUrl, userId];
    console.log('Server: Update query params:', updateParams);
    
    const updatedProfile = await pool.query(updateQuery, updateParams);
    
    // Transform the response to match client expectations
    const responseData = {
      id: updatedProfile.rows[0].id,
      name: updatedProfile.rows[0].name,
      username: updatedProfile.rows[0].username,
      email: updatedProfile.rows[0].email,
      bio: updatedProfile.rows[0].bio,
      avatarUrl: updatedProfile.rows[0].avatar_url,  // Make sure this matches the client's expected property name
      created_at: updatedProfile.rows[0].created_at,
      updated_at: updatedProfile.rows[0].updated_at
    };
    
    console.log('Server: Updated profile result:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Change user password
 */
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;
    
    // Check if required fields are provided
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current password and new password' });
    }

    // Get current user data
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Check for at least one uppercase letter, one lowercase letter, and one number
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return res.status(400).json({ 
        message: 'Password must include at least one uppercase letter, one lowercase letter, and one number' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );
    
    // Send password change notification email
    try {
      await emailService.sendNotificationEmail(
        user.email,
        user.username || user.name || 'User',
        'Your VibeFlo Password Has Been Changed',
        'Your account password was recently changed. If you made this change, no further action is required. If you did not make this change, please contact support immediately.'
      );
      console.log(`Password change notification email sent to ${user.email}`);
    } catch (emailError) {
      // Log the error but don't fail the password change
      console.error('Error sending password change notification email:', emailError);
    }
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete user account
 */
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { password, testMode } = req.body;
    
    // Check if password is provided
    if (!password) {
      return res.status(400).json({ message: 'Please provide your password' });
    }

    // Get current user data
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    // If in test mode, just log and return success without deleting
    if (testMode === true) {
      console.log(`[TEST MODE] Would delete account for user ID: ${userId}, username: ${user.username}`);
      return res.json({ 
        message: 'TEST MODE: Account deletion was simulated successfully. No actual deletion occurred.',
        testMode: true
      });
    }

    // Start a transaction to ensure data integrity during deletion
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if verification_tokens table exists
      const verificationTokensExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'verification_tokens'
        );
      `);
      
      if (verificationTokensExists.rows[0].exists) {
        // Delete user's verification tokens
        await client.query('DELETE FROM verification_tokens WHERE user_id = $1', [userId]);
      }
      
      // Check if password_reset_tokens table exists
      const passwordResetTokensExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'password_reset_tokens'
        );
      `);
      
      if (passwordResetTokensExists.rows[0].exists) {
        // Delete user's password reset tokens
        await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
      }
      
      // Check if failed_login_attempts table exists
      const failedLoginAttemptsExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'failed_login_attempts'
        );
      `);
      
      if (failedLoginAttemptsExists.rows[0].exists) {
        // Delete user's failed login attempts
        await client.query('DELETE FROM failed_login_attempts WHERE login_identifier = $1', [user.email]);
      }
      
      // Check if playlists table exists
      const playlistsExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'playlists'
        );
      `);
      
      if (playlistsExists.rows[0].exists) {
        // Delete user's playlists
        await client.query('DELETE FROM playlists WHERE user_id = $1', [userId]);
      }
      
      // Check if pomodoro_sessions table exists
      const pomodoroSessionsExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'pomodoro_sessions'
        );
      `);
      
      if (pomodoroSessionsExists.rows[0].exists) {
        // Delete user's pomodoro sessions
        await client.query('DELETE FROM pomodoro_sessions WHERE user_id = $1', [userId]);
      }
      
      // Check if pomodoro_todos table exists (not 'todos')
      const pomodoroTodosExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'pomodoro_todos'
        );
      `);
      
      if (pomodoroTodosExists.rows[0].exists) {
        // Delete user's todos
        await client.query('DELETE FROM pomodoro_todos WHERE user_id = $1', [userId]);
      }
      
      // Check if user_settings table exists
      const userSettingsExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_settings'
        );
      `);
      
      if (userSettingsExists.rows[0].exists) {
        // Delete user's settings
        await client.query('DELETE FROM user_settings WHERE user_id = $1', [userId]);
      }
      
      // Check if user_themes table exists
      const userThemesExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_themes'
        );
      `);
      
      if (userThemesExists.rows[0].exists) {
        // Delete user's themes
        await client.query('DELETE FROM user_themes WHERE user_id = $1', [userId]);
      }
      
      // Finally, delete the user
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      
      await client.query('COMMIT');
      
      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 