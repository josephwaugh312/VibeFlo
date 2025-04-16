/**
 * Storage keys used in the application
 */
export const StorageKeys = {
  // Auth-related keys
  TOKEN: 'token',
  USER: 'user',
  CACHED_USER: 'cachedUser',
  
  // Spotify-related keys
  SPOTIFY_ACCESS_TOKEN: 'spotify_access_token',
  SPOTIFY_TOKEN_EXPIRY: 'spotify_token_expiry',
  SPOTIFY_REFRESH_TOKEN: 'spotify_refresh_token',
  SPOTIFY_AUTH_STATE: 'spotify_auth_state',
  
  // Playlist-related keys
  VIBEFLO_PLAYLIST: 'vibeflo_playlist',
  VIBEFLO_CURRENT_TRACK: 'vibeflo_current_track',
  VIBEFLO_PLAYLIST_UPDATED: 'vibeflo_playlist_updated',
  VIBEFLO_PLAYER_OPEN: 'vibeflo_player_open',
  
  // Pomodoro-related keys
  POMODORO_TODOS: 'pomodoro-todos'
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