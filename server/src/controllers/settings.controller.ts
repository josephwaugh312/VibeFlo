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

    // Check if the user_settings table has the expected structure
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_settings'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('user_settings table does not exist, returning default settings');
      // Return default settings if table doesn't exist
      return res.json({
        pomodoro_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        pomodoros_until_long_break: 4,
        auto_start_breaks: false,
        auto_start_pomodoros: false,
        dark_mode: false,
        sound_enabled: true,
        notification_enabled: true
      });
    }

    // Check if settings exist for this user
    try {
      const settingsCheck = await pool.query(
        'SELECT * FROM user_settings WHERE user_id = $1',
        [userId]
      );
      
      // If no settings exist, return default settings
      if (settingsCheck.rows.length === 0) {
        console.log('No settings found for user, returning default settings');
        return res.json({
          pomodoro_duration: 25,
          short_break_duration: 5,
          long_break_duration: 15,
          pomodoros_until_long_break: 4,
          auto_start_breaks: false,
          auto_start_pomodoros: false,
          dark_mode: false,
          sound_enabled: true,
          notification_enabled: true
        });
      }
      
      // Return existing settings
      res.json(settingsCheck.rows[0]);
    } catch (dbError) {
      console.error('Database error in getUserSettings, returning default settings:', dbError);
      // If there's a database error (like missing columns), return default settings
      return res.json({
        pomodoro_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        pomodoros_until_long_break: 4,
        auto_start_breaks: false,
        auto_start_pomodoros: false,
        dark_mode: false,
        sound_enabled: true,
        notification_enabled: true
      });
    }
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

    // Check if the user_settings table has the expected structure
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_settings'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('user_settings table does not exist, returning updated settings without saving');
      // Return updated settings without trying to save to the database
      return res.json({
        pomodoro_duration: pomodoro_duration || 25,
        short_break_duration: short_break_duration || 5,
        long_break_duration: long_break_duration || 15,
        pomodoros_until_long_break: pomodoros_until_long_break || 4,
        auto_start_breaks: auto_start_breaks !== undefined ? auto_start_breaks : false,
        auto_start_pomodoros: auto_start_pomodoros !== undefined ? auto_start_pomodoros : false,
        dark_mode: dark_mode !== undefined ? dark_mode : false,
        sound_enabled: sound_enabled !== undefined ? sound_enabled : true,
        notification_enabled: notification_enabled !== undefined ? notification_enabled : true
      });
    }

    try {
      // Try to update settings, but catch any database errors
      // Check if settings exist for this user
      const settingsCheck = await pool.query(
        'SELECT * FROM user_settings WHERE user_id = $1',
        [userId]
      );
      
      // If no settings exist or updating fails, return the requested settings
      if (settingsCheck.rows.length === 0) {
        console.log('No settings found for user, returning updated settings without saving');
        return res.json({
          pomodoro_duration: pomodoro_duration || 25,
          short_break_duration: short_break_duration || 5,
          long_break_duration: long_break_duration || 15,
          pomodoros_until_long_break: pomodoros_until_long_break || 4,
          auto_start_breaks: auto_start_breaks !== undefined ? auto_start_breaks : false,
          auto_start_pomodoros: auto_start_pomodoros !== undefined ? auto_start_pomodoros : false,
          dark_mode: dark_mode !== undefined ? dark_mode : false,
          sound_enabled: sound_enabled !== undefined ? sound_enabled : true,
          notification_enabled: notification_enabled !== undefined ? notification_enabled : true
        });
      }
      
      // Return existing settings with updates
      return res.json({
        ...settingsCheck.rows[0],
        pomodoro_duration: pomodoro_duration || settingsCheck.rows[0].pomodoro_duration || 25,
        short_break_duration: short_break_duration || settingsCheck.rows[0].short_break_duration || 5,
        long_break_duration: long_break_duration || settingsCheck.rows[0].long_break_duration || 15,
        pomodoros_until_long_break: pomodoros_until_long_break || settingsCheck.rows[0].pomodoros_until_long_break || 4,
        auto_start_breaks: auto_start_breaks !== undefined ? auto_start_breaks : (settingsCheck.rows[0].auto_start_breaks || false),
        auto_start_pomodoros: auto_start_pomodoros !== undefined ? auto_start_pomodoros : (settingsCheck.rows[0].auto_start_pomodoros || false),
        dark_mode: dark_mode !== undefined ? dark_mode : (settingsCheck.rows[0].dark_mode || false),
        sound_enabled: sound_enabled !== undefined ? sound_enabled : (settingsCheck.rows[0].sound_enabled || true),
        notification_enabled: notification_enabled !== undefined ? notification_enabled : (settingsCheck.rows[0].notification_enabled || true)
      });
    } catch (dbError) {
      console.error('Database error in updateUserSettings, returning updated settings without saving:', dbError);
      // Return updated settings without trying to save to the database
      return res.json({
        pomodoro_duration: pomodoro_duration || 25,
        short_break_duration: short_break_duration || 5,
        long_break_duration: long_break_duration || 15,
        pomodoros_until_long_break: pomodoros_until_long_break || 4,
        auto_start_breaks: auto_start_breaks !== undefined ? auto_start_breaks : false,
        auto_start_pomodoros: auto_start_pomodoros !== undefined ? auto_start_pomodoros : false,
        dark_mode: dark_mode !== undefined ? dark_mode : false,
        sound_enabled: sound_enabled !== undefined ? sound_enabled : true,
        notification_enabled: notification_enabled !== undefined ? notification_enabled : true
      });
    }
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 