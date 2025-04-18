import { Request, Response } from 'express';
import pool from '../config/db';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * Get all available themes
 */
export const getAllThemes = async (req: Request, res: Response) => {
  try {
    const themes = await pool.query(
      'SELECT * FROM themes ORDER BY is_default DESC, name ASC'
    );
    
    res.json(themes.rows);
  } catch (error) {
    console.error('Error fetching themes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get a single theme by ID
 */
export const getThemeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const theme = await pool.query('SELECT * FROM themes WHERE id = $1', [id]);
    
    if (theme.rows.length === 0) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    res.json(theme.rows[0]);
  } catch (error) {
    console.error('Error fetching theme:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all custom themes created by users
 */
export const getPublicCustomThemes = async (req: Request, res: Response) => {
  try {
    const customThemes = await pool.query(
      `SELECT ct.*, u.name as creator 
       FROM custom_themes ct 
       JOIN users u ON ct.user_id = u.id 
       WHERE ct.is_public = true 
       ORDER BY ct.created_at DESC`
    );
    
    res.json(customThemes.rows);
  } catch (error) {
    console.error('Error fetching public custom themes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get user's custom themes
 */
export const getUserCustomThemes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const customThemes = await pool.query(
      'SELECT * FROM custom_themes WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(customThemes.rows);
  } catch (error) {
    console.error('Error fetching user custom themes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new custom theme
 */
export const createCustomTheme = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { name, description, image_url, is_public, prompt } = req.body;
    
    if (!name || !image_url) {
      return res.status(400).json({ message: 'Name and image URL are required' });
    }

    // Default moderation status is 'pending' if theme is public
    const moderationStatus = is_public ? 'pending' : null;
    const actualIsPublic = is_public ? false : false; // Set to false if is_public is true (pending moderation)
    
    const newTheme = await pool.query(
      `INSERT INTO custom_themes 
       (user_id, name, description, image_url, is_public, prompt, 
        moderation_status, moderation_notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        userId, 
        name, 
        description || null, 
        image_url, 
        actualIsPublic, 
        prompt || null,
        moderationStatus,
        is_public ? 'Theme pending moderation review' : null
      ]
    );
    
    const theme = newTheme.rows[0];
    
    // Add a message to inform the user about moderation if theme is public
    const responseObj = {
      ...theme,
      message: is_public ? 
        'Your theme has been submitted for moderation and will be public once approved.' :
        'Theme created successfully.'
    };
    
    res.status(201).json(responseObj);
  } catch (error) {
    console.error('Error creating custom theme:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a custom theme
 */
export const updateCustomTheme = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if theme exists and belongs to user
    const themeCheck = await pool.query(
      'SELECT * FROM custom_themes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (themeCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Theme not found or not owned by user' });
    }

    const existingTheme = themeCheck.rows[0];
    const { name, description, image_url, is_public, prompt } = req.body;
    
    // Determine if moderation status needs to be updated
    let moderationStatus = existingTheme.moderation_status;
    let actualIsPublic = is_public;
    let moderationNotes = existingTheme.moderation_notes;
    
    // If the theme wasn't public before but is now, or if the image has changed for a public theme
    const imageChanged = image_url && image_url !== existingTheme.image_url;
    
    if ((is_public && !existingTheme.is_public) || (is_public && imageChanged)) {
      moderationStatus = 'pending';
      actualIsPublic = false; // Keep it private until approved
      moderationNotes = 'Theme pending moderation review';
    }
    
    const updatedTheme = await pool.query(
      `UPDATE custom_themes 
       SET name = COALESCE($3, name),
           description = COALESCE($4, description),
           image_url = COALESCE($5, image_url),
           is_public = COALESCE($6, is_public),
           prompt = COALESCE($7, prompt),
           moderation_status = $8,
           moderation_notes = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        id, 
        userId, 
        name, 
        description, 
        image_url, 
        actualIsPublic, 
        prompt,
        moderationStatus,
        moderationNotes
      ]
    );
    
    const theme = updatedTheme.rows[0];
    
    // Add a message to inform the user about moderation if needed
    const responseObj = {
      ...theme,
      message: moderationStatus === 'pending' ? 
        'Your theme has been submitted for moderation and will be public once approved.' :
        'Theme updated successfully.'
    };
    
    res.json(responseObj);
  } catch (error) {
    console.error('Error updating custom theme:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a custom theme
 */
export const deleteCustomTheme = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if theme exists and belongs to user
    const themeCheck = await pool.query(
      'SELECT * FROM custom_themes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (themeCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Theme not found or not owned by user' });
    }

    await pool.query(
      'DELETE FROM custom_themes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    res.json({ message: 'Theme deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom theme:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Set user's active theme
 */
export const setUserTheme = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { theme_id } = req.body;
    
    console.log(`[SERVER] Setting theme_id ${theme_id} for user ${userId}`);
    console.log(`[SERVER] Current time: ${new Date().toISOString()}`);
    
    if (!theme_id) {
      return res.status(400).json({ message: 'Theme ID is required' });
    }

    // Ensure theme_id is treated as a number
    const numericThemeId = parseInt(theme_id, 10);
    if (isNaN(numericThemeId)) {
      return res.status(400).json({ message: 'Invalid theme ID format' });
    }
    
    // Check if the theme exists in either standard or custom themes
    let themeExists = false;
    let themeData = null;
    
    console.log(`[SERVER] Checking if theme ID ${numericThemeId} exists in standard themes...`);
    const standardTheme = await pool.query('SELECT * FROM themes WHERE id = $1', [numericThemeId]);
    if (standardTheme.rows.length > 0) {
      themeExists = true;
      themeData = standardTheme.rows[0];
      console.log(`[SERVER] Theme ID ${numericThemeId} found in standard themes: ${themeData.name}`);
    } else {
      console.log(`[SERVER] Theme ID ${numericThemeId} not found in standard themes, checking custom themes...`);
      
      const customTheme = await pool.query('SELECT * FROM custom_themes WHERE id = $1', [numericThemeId]);
      if (customTheme.rows.length > 0) {
        themeExists = true;
        themeData = customTheme.rows[0];
        console.log(`[SERVER] Theme ID ${numericThemeId} found in custom themes: ${themeData.name}`);
      } else {
        console.log(`[SERVER] Theme ID ${numericThemeId} not found in either standard or custom themes!`);
      }
    }
    
    if (!themeExists) {
      console.error(`[SERVER] Theme ID ${numericThemeId} not found in either theme table!`);
      
      // If requested theme doesn't exist, fetch and return the default theme
      const defaultTheme = await pool.query(
        'SELECT * FROM themes WHERE is_default = true LIMIT 1'
      );
      
      if (defaultTheme.rows.length > 0) {
        themeData = defaultTheme.rows[0];
        console.log(`[SERVER] Using default theme because requested theme doesn't exist: ${themeData.name}`);
        
        // Update user settings with default theme
        await updateUserThemeSettings(userId, themeData.id);
        
        // Ensure image_url and background_url are consistent
        if (!themeData.image_url && themeData.background_url) {
          themeData.image_url = themeData.background_url;
        } else if (themeData.image_url && !themeData.background_url) {
          themeData.background_url = themeData.image_url;
        }
        
        return res.json({ 
          message: 'Default theme set (requested theme not found)', 
          theme_id: themeData.id,
          theme: themeData
        });
        
      } else {
        return res.status(404).json({ message: 'Theme not found and no default theme available' });
      }
    }

    // Helper function to update user settings with the theme ID
    async function updateUserThemeSettings(userId: number, themeId: number) {
      try {
        // Check if user settings already exist
        const userSettings = await pool.query(
          'SELECT * FROM user_settings WHERE user_id = $1',
          [userId]
        );
        
        if (userSettings.rows.length === 0) {
          console.log(`[SERVER] No user settings found for user ${userId}, creating new settings`);
          // First update or create the user_settings record
          await pool.query(
            `INSERT INTO user_settings (user_id, theme_id) 
             VALUES ($1, $2)`,
            [userId, themeId]
          );
        } else {
          console.log(`[SERVER] Updating existing user settings for user ${userId}`);
          await pool.query(
            `UPDATE user_settings 
             SET theme_id = $2, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1`,
            [userId, themeId]
          );
        }
        
        console.log(`[SERVER] Successfully executed INSERT/UPDATE query for theme_id ${themeId}`);
        
        // Now verify the update
        const verifyUpdate = await pool.query(
          'SELECT theme_id FROM user_settings WHERE user_id = $1',
          [userId]
        );
        
        if (verifyUpdate.rows.length === 0) {
          console.error(`[SERVER ERROR] Failed to find user settings after update for user ${userId}`);
          throw new Error('Failed to update theme');
        }
        
        const savedThemeId = verifyUpdate.rows[0].theme_id;
        console.log(`[SERVER] Verification: theme_id saved as ${savedThemeId} (expected ${themeId})`);
        
        if (savedThemeId != themeId) { // Use loose comparison because of potential string/number conversion
          console.error(`[SERVER ERROR] Theme ID mismatch! Expected ${themeId}, but found ${savedThemeId}`);
        }
        
        return true;
      } catch (error) {
        console.error(`[SERVER ERROR] Error updating user theme settings:`, error);
        throw error;
      }
    }

    // Update user settings with the theme ID
    await updateUserThemeSettings(userId, numericThemeId);
    
    // Ensure image_url and background_url are consistent
    if (themeData) {
      if (!themeData.image_url && themeData.background_url) {
        themeData.image_url = themeData.background_url;
      } else if (themeData.image_url && !themeData.background_url) {
        themeData.background_url = themeData.image_url;
      }
    }
    
    res.json({ 
      message: 'Theme updated successfully', 
      theme_id: numericThemeId,
      theme: themeData || null
    });
  } catch (error) {
    console.error('Error setting user theme:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get user's active theme
 */
export const getUserTheme = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log(`[SERVER] Getting active theme for user ${userId}`);

    // Get user's theme_id from settings
    const userSettings = await pool.query(
      'SELECT theme_id FROM user_settings WHERE user_id = $1',
      [userId]
    );
    
    console.log(`[SERVER] User settings:`, userSettings.rows);
    
    let themeId = null;
    let theme = null;
    
    if (userSettings.rows.length > 0 && userSettings.rows[0].theme_id) {
      themeId = userSettings.rows[0].theme_id;
      console.log(`[SERVER] Found theme_id ${themeId} for user ${userId}`);
      
      // Try to get the theme from standard themes first
      console.log(`[SERVER] Checking standard themes for ID ${themeId}`);
      const standardTheme = await pool.query(
        'SELECT * FROM themes WHERE id = $1', 
        [themeId]
      );
      
      if (standardTheme.rows.length > 0) {
        theme = standardTheme.rows[0];
        console.log(`[SERVER] Found standard theme with ID ${themeId}:`, theme.name);
      } else {
        // If not found in standard themes, try custom themes
        console.log(`[SERVER] Standard theme not found, checking custom themes for ID ${themeId}`);
        const customTheme = await pool.query(
          'SELECT * FROM custom_themes WHERE id = $1',
          [themeId]
        );
        
        if (customTheme.rows.length > 0) {
          theme = customTheme.rows[0];
          console.log(`[SERVER] Found custom theme with ID ${themeId}:`, theme.name);
        } else {
          console.log(`[SERVER] No theme found with ID ${themeId} - this theme might have been deleted`);
          
          // If the theme is not found (likely because it was deleted), reset the user's theme setting to null
          try {
            await pool.query(
              `UPDATE user_settings 
               SET theme_id = NULL, updated_at = CURRENT_TIMESTAMP
               WHERE user_id = $1`,
              [userId]
            );
            console.log(`[SERVER] Reset user's theme setting to null because theme ID ${themeId} was not found`);
          } catch (updateError) {
            console.error(`[SERVER] Error resetting user's theme setting:`, updateError);
            // Continue even if this update fails
          }
        }
      }
    }
    
    // If no theme found, get the default theme
    if (!theme) {
      console.log(`[SERVER] Using default theme as fallback`);
      const defaultTheme = await pool.query(
        'SELECT * FROM themes WHERE is_default = true LIMIT 1'
      );
      
      if (defaultTheme.rows.length > 0) {
        theme = defaultTheme.rows[0];
        console.log(`[SERVER] Returning default theme as fallback:`, theme.name);
        
        // Also update the user's theme setting to the default theme
        try {
          await pool.query(
            `UPDATE user_settings 
             SET theme_id = $2::integer, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1`,
            [userId, theme.id]
          );
          console.log(`[SERVER] Updated user's theme setting to default theme ID ${theme.id}`);
        } catch (updateError) {
          console.error(`[SERVER] Error updating user's theme setting to default:`, updateError);
          // Continue even if this update fails
        }
      } else {
        return res.status(404).json({ message: 'No default theme found' });
      }
    }
    
    // Ensure image_url and background_url are consistent
    if (theme) {
      if (!theme.image_url && theme.background_url) {
        theme.image_url = theme.background_url;
      } else if (theme.image_url && !theme.background_url) {
        theme.background_url = theme.image_url;
      }
      
      console.log(`[SERVER] Successfully returning theme ${theme.name} with ID ${theme.id}`);
      return res.json(theme);
    }
    
    res.status(404).json({ message: 'Theme not found' });
  } catch (error) {
    console.error('Error fetching user theme:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 