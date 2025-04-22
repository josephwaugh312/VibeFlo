/**
 * Validation utility functions for the application
 */

/**
 * Validates password strength
 * @param password - The password to validate
 * @returns Object containing validation result and error message if any
 */
export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  // Check password length
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long'
    };
  }

  // Check for at least one uppercase letter, one lowercase letter, and one number
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return {
      isValid: false,
      message: 'Password must include at least one uppercase letter, one lowercase letter, and one number'
    };
  }

  return { isValid: true };
};

/**
 * Validates username format
 * @param username - The username to validate
 * @returns Object containing validation result and error message if any
 */
export const validateUsername = (username: string): { isValid: boolean; message?: string } => {
  // Check if username is provided
  if (!username) {
    return {
      isValid: false,
      message: 'Username is required'
    };
  }

  // Check username format - 3-20 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      message: 'Username must be 3-20 characters and can only contain letters, numbers, and underscores'
    };
  }

  return { isValid: true };
};

/**
 * Validates email format
 * @param email - The email to validate
 * @returns Object containing validation result and error message if any
 */
export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  // Check if email is provided
  if (!email) {
    return {
      isValid: false,
      message: 'Email is required'
    };
  }

  // Check basic email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: 'Please provide a valid email address'
    };
  }

  return { isValid: true };
}; 