/**
 * Storage keys used in the application
 */
export const StorageKeys = {
  // User-related keys
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  
  // App state keys
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  MUSIC_PLAYER_STATE: 'music_player_state',
  POMODORO_SETTINGS: 'pomodoro_settings',
  
  // Playlist-related keys
  PLAYLIST: 'playlist',
  CURRENT_TRACK: 'current_track'
};

/**
 * Set a value in localStorage with optional JSON stringification
 * @param key - Storage key
 * @param value - Value to store (will be JSON stringified if an object)
 */
export const setStorageItem = <T>(key: string, value: T): void => {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
      return;
    }
    
    const storageValue = typeof value === 'object' 
      ? JSON.stringify(value) 
      : String(value);
    
    localStorage.setItem(key, storageValue);
  } catch (error) {
    console.error(`Error setting localStorage item [${key}]:`, error);
  }
};

/**
 * Get a value from localStorage with optional JSON parsing
 * @param key - Storage key
 * @param parseJson - Whether to parse the value as JSON
 * @returns The stored value or null if not found
 */
export const getStorageItem = <T>(key: string, parseJson = false): T | null => {
  try {
    const value = localStorage.getItem(key);
    
    if (value === null) {
      return null;
    }
    
    if (parseJson) {
      return JSON.parse(value) as T;
    }
    
    return value as unknown as T;
  } catch (error) {
    console.error(`Error getting localStorage item [${key}]:`, error);
    return null;
  }
};

/**
 * Remove an item from localStorage
 * @param key - Storage key to remove
 */
export const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage item [${key}]:`, error);
  }
};

/**
 * Clear all items from localStorage
 */
export const clearStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

/**
 * Check if an item exists in localStorage
 * @param key - Storage key to check
 * @returns True if the item exists
 */
export const hasStorageItem = (key: string): boolean => {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error(`Error checking localStorage item [${key}]:`, error);
    return false;
  }
}; 