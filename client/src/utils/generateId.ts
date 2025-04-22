/**
 * Generates a random unique ID string.
 * Used for creating identifiers for tasks and other elements.
 * @returns {string} A random string ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}; 