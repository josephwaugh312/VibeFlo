// Simplified settings controller for testing

/**
 * Get user settings
 * @param {Object} req - Express request object with authenticated user
 * @param {Object} res - Express response object
 */
const getUserSettings = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    const db = req.app?.locals?.db?.pool || require('../config/db');
    
    // Check if settings exist for this user
    const settings = await db.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );
    
    // If settings exist, return them
    if (settings.rows.length > 0) {
      return res.json(settings.rows[0]);
    }
    
    // If no settings exist, create default settings
    const defaultSettings = {
      pomodoro_duration: 25,
      short_break_duration: 5,
      long_break_duration: 15,
      pomodoros_until_long_break: 4,
      auto_start_breaks: false,
      auto_start_pomodoros: false,
      dark_mode: false,
      sound_enabled: true,
      notification_enabled: true
    };
    
    // Insert default settings into database
    const newSettings = await db.query(
      `INSERT INTO user_settings 
       (user_id, pomodoro_duration, short_break_duration, long_break_duration, 
        pomodoros_until_long_break, auto_start_breaks, auto_start_pomodoros,
        dark_mode, sound_enabled, notification_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        userId,
        defaultSettings.pomodoro_duration,
        defaultSettings.short_break_duration,
        defaultSettings.long_break_duration,
        defaultSettings.pomodoros_until_long_break,
        defaultSettings.auto_start_breaks,
        defaultSettings.auto_start_pomodoros,
        defaultSettings.dark_mode,
        defaultSettings.sound_enabled,
        defaultSettings.notification_enabled
      ]
    );
    
    res.json(newSettings.rows[0]);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update user settings
 * @param {Object} req - Express request object with authenticated user and settings in body
 * @param {Object} res - Express response object
 */
const updateUserSettings = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    const db = req.app?.locals?.db?.pool || require('../config/db');
    
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
    
    // Validate input values
    if (pomodoro_duration !== undefined && (pomodoro_duration < 1 || pomodoro_duration > 60)) {
      return res.status(400).json({ message: 'Pomodoro duration must be between 1 and 60 minutes' });
    }
    
    if (short_break_duration !== undefined && (short_break_duration < 1 || short_break_duration > 30)) {
      return res.status(400).json({ message: 'Short break duration must be between 1 and 30 minutes' });
    }
    
    if (long_break_duration !== undefined && (long_break_duration < 1 || long_break_duration > 60)) {
      return res.status(400).json({ message: 'Long break duration must be between 1 and 60 minutes' });
    }
    
    if (pomodoros_until_long_break !== undefined && 
        (pomodoros_until_long_break < 1 || pomodoros_until_long_break > 10)) {
      return res.status(400).json({ 
        message: 'Number of pomodoros until long break must be between 1 and 10' 
      });
    }
    
    // Check if settings exist for this user
    const settingsCheck = await db.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );
    
    if (settingsCheck.rows.length === 0) {
      // If no settings exist, create new settings
      const newSettings = await db.query(
        `INSERT INTO user_settings 
         (user_id, pomodoro_duration, short_break_duration, long_break_duration, 
          pomodoros_until_long_break, auto_start_breaks, auto_start_pomodoros,
          dark_mode, sound_enabled, notification_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          userId,
          pomodoro_duration || 25,
          short_break_duration || 5,
          long_break_duration || 15,
          pomodoros_until_long_break || 4,
          auto_start_breaks !== undefined ? auto_start_breaks : false,
          auto_start_pomodoros !== undefined ? auto_start_pomodoros : false,
          dark_mode !== undefined ? dark_mode : false,
          sound_enabled !== undefined ? sound_enabled : true,
          notification_enabled !== undefined ? notification_enabled : true
        ]
      );
      
      return res.json(newSettings.rows[0]);
    } else {
      // If settings exist, update them
      const updatedSettings = await db.query(
        `UPDATE user_settings 
         SET pomodoro_duration = COALESCE($2, pomodoro_duration),
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
      
      return res.json(updatedSettings.rows[0]);
    }
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserSettings,
  updateUserSettings
}; 