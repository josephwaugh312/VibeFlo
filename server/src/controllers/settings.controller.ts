import { Request, Response } from 'express';
import pool from '../config/db';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * Get user settings
 */
export const getUserSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if settings exist for this user
    const settingsCheck = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );
    
    // If no settings exist, create default settings
    if (settingsCheck.rows.length === 0) {
      const newSettings = await pool.query(
        `INSERT INTO user_settings 
        (user_id, pomodoro_duration, short_break_duration, long_break_duration, pomodoros_until_long_break)
        VALUES ($1, 25, 5, 15, 4)
        RETURNING *`,
        [userId]
      );
      
      return res.json(newSettings.rows[0]);
    }
    
    // Return existing settings
    res.json(settingsCheck.rows[0]);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update user settings
 */
export const updateUserSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { 
      pomodoro_duration, 
      short_break_duration, 
      long_break_duration, 
      pomodoros_until_long_break,
      auto_start_breaks,
      auto_start_pomodoros,
      dark_mode,
      sound_enabled,
      notification_enabled
    } = req.body;

    // Validate settings
    if (pomodoro_duration !== undefined && (pomodoro_duration < 1 || pomodoro_duration > 60)) {
      return res.status(400).json({ message: 'Pomodoro duration must be between 1 and 60 minutes' });
    }
    
    if (short_break_duration !== undefined && (short_break_duration < 1 || short_break_duration > 30)) {
      return res.status(400).json({ message: 'Short break duration must be between 1 and 30 minutes' });
    }
    
    if (long_break_duration !== undefined && (long_break_duration < 1 || long_break_duration > 60)) {
      return res.status(400).json({ message: 'Long break duration must be between 1 and 60 minutes' });
    }
    
    if (pomodoros_until_long_break !== undefined && (pomodoros_until_long_break < 1 || pomodoros_until_long_break > 10)) {
      return res.status(400).json({ message: 'Pomodoros until long break must be between 1 and 10' });
    }

    // Check if settings exist for this user
    const settingsCheck = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );
    
    // If no settings exist, create new settings
    if (settingsCheck.rows.length === 0) {
      const newSettings = await pool.query(
        `INSERT INTO user_settings (
          user_id, 
          pomodoro_duration, 
          short_break_duration, 
          long_break_duration, 
          pomodoros_until_long_break,
          auto_start_breaks,
          auto_start_pomodoros,
          dark_mode,
          sound_enabled,
          notification_enabled
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          userId,
          pomodoro_duration || 25,
          short_break_duration || 5,
          long_break_duration || 15,
          pomodoros_until_long_break || 4,
          auto_start_breaks !== undefined ? auto_start_breaks : true,
          auto_start_pomodoros !== undefined ? auto_start_pomodoros : true,
          dark_mode !== undefined ? dark_mode : false,
          sound_enabled !== undefined ? sound_enabled : true,
          notification_enabled !== undefined ? notification_enabled : true
        ]
      );
      
      return res.json(newSettings.rows[0]);
    }
    
    // Update existing settings
    const updatedSettings = await pool.query(
      `UPDATE user_settings SET
        pomodoro_duration = COALESCE($2, pomodoro_duration),
        short_break_duration = COALESCE($3, short_break_duration),
        long_break_duration = COALESCE($4, long_break_duration),
        pomodoros_until_long_break = COALESCE($5, pomodoros_until_long_break),
        auto_start_breaks = COALESCE($6, auto_start_breaks),
        auto_start_pomodoros = COALESCE($7, auto_start_pomodoros),
        dark_mode = COALESCE($8, dark_mode),
        sound_enabled = COALESCE($9, sound_enabled),
        notification_enabled = COALESCE($10, notification_enabled),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *`,
      [
        userId,
        pomodoro_duration,
        short_break_duration,
        long_break_duration,
        pomodoros_until_long_break,
        auto_start_breaks,
        auto_start_pomodoros,
        dark_mode,
        sound_enabled,
        notification_enabled
      ]
    );
    
    res.json(updatedSettings.rows[0]);
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 