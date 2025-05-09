// Simplified theme controller functions for testing

/**
 * Get all themes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAllThemes = async (req, res, next) => {
  try {
    const db = req.app.locals.db || require('../config/db');
    const result = await db.query('SELECT * FROM themes ORDER BY is_default DESC, name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching themes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get theme by ID
 * @param {Object} req - Express request object with id parameter
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getThemeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db || require('../config/db');
    const result = await db.query('SELECT * FROM themes WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching theme by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all public custom themes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getPublicCustomThemes = async (req, res, next) => {
  try {
    const db = req.app.locals.db || require('../config/db');
    const result = await db.query(`
      SELECT ct.*, u.username as creator 
      FROM custom_themes ct
      JOIN users u ON ct.user_id = u.id
      WHERE ct.is_public = true AND ct.moderation_status = 'approved'
      ORDER BY ct.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching public custom themes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get user's custom themes
 * @param {Object} req - Express request object with authenticated user
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getUserCustomThemes = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    const db = req.app.locals.db || require('../config/db');
    const result = await db.query(
      'SELECT * FROM custom_themes WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user custom themes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Set user's active theme
 * @param {Object} req - Express request object with authenticated user and theme_id in body
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const setUserTheme = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    const { theme_id } = req.body;
    
    if (!theme_id) {
      return res.status(400).json({ message: 'Theme ID is required' });
    }
    
    const db = req.app.locals.db || require('../config/db');
    
    // Check if the theme exists in either standard or custom themes
    let themeExists = false;
    let themeData = null;
    
    // Check in standard themes
    const standardTheme = await db.query('SELECT * FROM themes WHERE id = $1', [theme_id]);
    
    if (standardTheme.rows.length > 0) {
      themeExists = true;
      themeData = standardTheme.rows[0];
    } else {
      // Check in custom themes
      const customTheme = await db.query('SELECT * FROM custom_themes WHERE id = $1', [theme_id]);
      
      if (customTheme.rows.length > 0) {
        themeExists = true;
        themeData = customTheme.rows[0];
      }
    }
    
    if (!themeExists) {
      // If theme doesn't exist, use default theme
      const defaultTheme = await db.query(
        'SELECT * FROM themes WHERE is_default = true LIMIT 1'
      );
      
      if (defaultTheme.rows.length > 0) {
        themeData = defaultTheme.rows[0];
        
        // Update user settings with default theme
        await updateUserSettings(userId, themeData.id, db);
        
        return res.json({
          message: 'Default theme set (requested theme not found)',
          theme_id: themeData.id,
          theme: themeData
        });
      } else {
        return res.status(404).json({ message: 'Theme not found and no default theme available' });
      }
    }
    
    // Update user settings with the theme ID
    await updateUserSettings(userId, theme_id, db);
    
    res.json({
      message: 'Theme updated successfully',
      theme_id: theme_id,
      theme: themeData
    });
  } catch (error) {
    console.error('Error setting user theme:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Helper function to update user theme settings
 * @param {number|string} userId - User ID
 * @param {number|string} themeId - Theme ID
 * @param {Object} db - Database connection
 */
async function updateUserSettings(userId, themeId, db) {
  // Check if user settings already exist
  const userSettings = await db.query(
    'SELECT * FROM user_settings WHERE user_id = $1',
    [userId]
  );
  
  if (userSettings.rows.length === 0) {
    // Create new settings
    await db.query(
      'INSERT INTO user_settings (user_id, theme_id) VALUES ($1, $2)',
      [userId, themeId]
    );
  } else {
    // Update existing settings
    await db.query(
      'UPDATE user_settings SET theme_id = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [userId, themeId]
    );
  }
}

/**
 * Get user's active theme
 * @param {Object} req - Express request object with authenticated user
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getUserTheme = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    const db = req.app.locals.db || require('../config/db');
    
    // Get user's theme_id from settings
    const userSettings = await db.query(
      'SELECT theme_id FROM user_settings WHERE user_id = $1',
      [userId]
    );
    
    let themeId = null;
    let theme = null;
    
    if (userSettings.rows.length > 0 && userSettings.rows[0].theme_id) {
      themeId = userSettings.rows[0].theme_id;
      
      // Try to get the theme from standard themes first
      const standardTheme = await db.query(
        'SELECT * FROM themes WHERE id = $1',
        [themeId]
      );
      
      if (standardTheme.rows.length > 0) {
        theme = standardTheme.rows[0];
      } else {
        // If not found in standard themes, try custom themes
        const customTheme = await db.query(
          'SELECT * FROM custom_themes WHERE id = $1',
          [themeId]
        );
        
        if (customTheme.rows.length > 0) {
          theme = customTheme.rows[0];
        }
      }
    }
    
    // If no theme found, get the default theme
    if (!theme) {
      const defaultTheme = await db.query(
        'SELECT * FROM themes WHERE is_default = true LIMIT 1'
      );
      
      if (defaultTheme.rows.length > 0) {
        theme = defaultTheme.rows[0];
      } else {
        return res.status(404).json({ message: 'No default theme found' });
      }
    }
    
    // Return the theme
    res.json(theme);
  } catch (error) {
    console.error('Error getting user theme:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllThemes,
  getThemeById,
  getPublicCustomThemes,
  getUserCustomThemes,
  setUserTheme,
  getUserTheme
}; 