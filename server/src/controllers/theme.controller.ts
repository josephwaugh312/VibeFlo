import { Request, Response } from 'express';
import pool from '../config/db';
import { handleAsync } from '../utils/errorHandler';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * Get all available themes
 */
export const getAllThemes = handleAsync(async (req: Request, res: Response) => {
  const themes = await pool.query(
    'SELECT * FROM themes ORDER BY is_default DESC, name ASC'
  );
  
  res.json(themes.rows);
});

/**
 * Get a single theme by ID
 */
export const getThemeById = handleAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const theme = await pool.query('SELECT * FROM themes WHERE id = $1', [id]);
  
  if (theme.rows.length === 0) {
    return res.status(404).json({ message: 'Theme not found' });
  }
  
  res.json(theme.rows[0]);
});

/**
 * Get all custom themes created by users
 */
export const getPublicCustomThemes = handleAsync(async (req: Request, res: Response) => {
  const customThemes = await pool.query(
    `SELECT ct.*, u.name as creator 
     FROM custom_themes ct 
     JOIN users u ON ct.user_id = u.id 
     WHERE ct.is_public = true 
     ORDER BY ct.created_at DESC`
  );
  
  res.json(customThemes.rows);
});

/**
 * Get user's custom themes
 */
export const getUserCustomThemes = handleAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const customThemes = await pool.query(
    'SELECT * FROM custom_themes WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  
  res.json(customThemes.rows);
});

/**
 * Create a new custom theme
 */
export const createCustomTheme = handleAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const { 
    name, 
    description, 
    image_url, 
    is_public, 
    prompt,
    background_color = '#FFFFFF',
    text_color = '#333333',
    primary_color = '#6200EE',
    secondary_color = '#03DAC6',
    accent_color = '#BB86FC',
    is_dark = false
  } = req.body;
  
  if (!name || !image_url) {
    return res.status(400).json({ message: 'Name and image URL are required' });
  }

  // Remove moderation requirement - set public immediately if requested
  const actualIsPublic = is_public ? true : false;
  
  try {
    const newTheme = await pool.query(
      `INSERT INTO custom_themes 
       (user_id, name, description, image_url, is_public, prompt, 
        moderation_status, moderation_notes, background_color,
        text_color, primary_color, secondary_color, accent_color, is_dark) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
       RETURNING *`,
      [
        userId, 
        name, 
        description || null, 
        image_url, 
        actualIsPublic, 
        prompt || null,
        'approved', // Always set to approved
        null,
        background_color,
        text_color,
        primary_color,
        secondary_color,
        accent_color,
        is_dark
      ]
    );
    
    const theme = newTheme.rows[0];
    
    res.status(201).json({
      ...theme,
      message: 'Theme created successfully.'
    });
  } catch (error) {
    console.error('Error creating custom theme:', error);
    // Try a simplified insert with fewer columns as a fallback
    try {
      console.log('Attempting fallback insert with minimal columns');
      const fallbackTheme = await pool.query(
        `INSERT INTO custom_themes 
         (user_id, name, description, image_url, is_public, moderation_status) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [
          userId, 
          name, 
          description || null, 
          image_url, 
          actualIsPublic, 
          'approved'
        ]
      );
      
      const theme = fallbackTheme.rows[0];
      
      res.status(201).json({
        ...theme,
        message: 'Theme created successfully with fallback method.'
      });
    } catch (fallbackError) {
      console.error('Fallback insert also failed:', fallbackError);
      throw error; // Re-throw the original error to be handled by the error middleware
    }
  }
});

/**
 * Update a custom theme
 */
export const updateCustomTheme = handleAsync(async (req: AuthRequest, res: Response) => {
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
  const { 
    name, 
    description, 
    image_url, 
    is_public, 
    prompt,
    background_color,
    text_color,
    primary_color,
    secondary_color,
    accent_color,
    is_dark
  } = req.body;
  
  // Skip moderation and set public immediately if requested
  const actualIsPublic = is_public;
  
  try {
    const updatedTheme = await pool.query(
      `UPDATE custom_themes 
       SET name = COALESCE($3, name),
           description = COALESCE($4, description),
           image_url = COALESCE($5, image_url),
           is_public = COALESCE($6, is_public),
           prompt = COALESCE($7, prompt),
           background_color = COALESCE($8, background_color),
           text_color = COALESCE($9, text_color),
           primary_color = COALESCE($10, primary_color),
           secondary_color = COALESCE($11, secondary_color),
           accent_color = COALESCE($12, accent_color),
           is_dark = COALESCE($13, is_dark),
           moderation_status = 'approved',
           moderation_notes = null,
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
        background_color,
        text_color,
        primary_color,
        secondary_color,
        accent_color,
        is_dark
      ]
    );
    
    const theme = updatedTheme.rows[0];
    
    res.json({
      ...theme,
      message: 'Theme updated successfully.'
    });
  } catch (error) {
    console.error('Error updating custom theme:', error);
    // Try a simplified update with fewer columns as a fallback
    try {
      console.log('Attempting fallback update with minimal columns');
      const fallbackUpdate = await pool.query(
        `UPDATE custom_themes 
         SET name = COALESCE($3, name),
             description = COALESCE($4, description),
             image_url = COALESCE($5, image_url),
             is_public = COALESCE($6, is_public),
             moderation_status = 'approved',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [
          id, 
          userId, 
          name, 
          description, 
          image_url, 
          actualIsPublic
        ]
      );
      
      const theme = fallbackUpdate.rows[0];
      
      res.json({
        ...theme,
        message: 'Theme updated successfully with fallback method.'
      });
    } catch (fallbackError) {
      console.error('Fallback update also failed:', fallbackError);
      throw error; // Re-throw the original error to be handled by the error middleware
    }
  }
});

/**
 * Delete a custom theme
 */
export const deleteCustomTheme = handleAsync(async (req: AuthRequest, res: Response) => {
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
});

/**
 * Set user's active theme
 */
export const setUserTheme = handleAsync(async (req: AuthRequest, res: Response) => {
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

  // Use theme_id directly as UUID without parseInt
  // Remove previous numeric conversion
  
  // Check if the theme exists in either standard or custom themes
  let themeExists = false;
  let themeData = null;
  
  console.log(`[SERVER] Checking if theme ID ${theme_id} exists in standard themes...`);
  const standardTheme = await pool.query('SELECT * FROM themes WHERE id = $1', [theme_id]);
  if (standardTheme.rows.length > 0) {
    themeExists = true;
    themeData = standardTheme.rows[0];
    console.log(`[SERVER] Theme ID ${theme_id} found in standard themes: ${themeData.name}`);
  } else {
    console.log(`[SERVER] Theme ID ${theme_id} not found in standard themes, checking custom themes...`);
    
    const customTheme = await pool.query('SELECT * FROM custom_themes WHERE id = $1', [theme_id]);
    if (customTheme.rows.length > 0) {
      themeExists = true;
      themeData = customTheme.rows[0];
      console.log(`[SERVER] Theme ID ${theme_id} found in custom themes: ${themeData.name}`);
    } else {
      console.log(`[SERVER] Theme ID ${theme_id} not found in either standard or custom themes!`);
    }
  }
  
  if (!themeExists) {
    console.error(`[SERVER] Theme ID ${theme_id} not found in either theme table!`);
    
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

  // Helper function to update user settings with the theme ID - updated parameter types to string
  async function updateUserThemeSettings(userId: string, themeId: string) {
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
  await updateUserThemeSettings(userId, theme_id);
  
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
    theme_id: theme_id,
    theme: themeData || null
  });
});

/**
 * Get user's active theme
 */
export const getUserTheme = handleAsync(async (req: AuthRequest, res: Response) => {
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
           SET theme_id = $2, updated_at = CURRENT_TIMESTAMP
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
}); 