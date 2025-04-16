import { db } from '../db';

/**
 * Set a user's theme preference
 */
export const setUserTheme = async (userId: number, themeId: number) => {
  try {
    // Check if theme exists
    const theme = await db('themes').where({ id: themeId }).first();
    
    if (!theme) {
      return {
        success: false,
        error: 'Theme not found'
      };
    }
    
    // Check if user already has settings
    const userSettings = await db('user_settings').where({ user_id: userId }).first();
    
    if (userSettings) {
      // Update existing settings
      await db('user_settings')
        .where({ user_id: userId })
        .update({ theme_id: themeId });
    } else {
      // Create new settings
      await db('user_settings').insert({
        user_id: userId,
        theme_id: themeId
      });
    }
    
    return {
      success: true,
      theme_id: themeId
    };
  } catch (error) {
    console.error('Error setting user theme:', error);
    return {
      success: false,
      error: 'Failed to set theme'
    };
  }
};

/**
 * Get a user's theme preference
 */
export const getUserTheme = async (userId: number) => {
  try {
    // Get user settings with theme
    const userTheme = await db('user_settings')
      .join('themes', 'user_settings.theme_id', '=', 'themes.id')
      .where({ user_id: userId })
      .select('themes.*')
      .first();
    
    if (userTheme) {
      return userTheme;
    }
    
    // If no theme set, return default theme
    const defaultTheme = await db('themes').where({ id: 1 }).first();
    return defaultTheme;
  } catch (error) {
    console.error('Error getting user theme:', error);
    throw new Error('Failed to get theme');
  }
}; 