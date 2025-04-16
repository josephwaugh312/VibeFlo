/**
 * Type definition for validation results
 */
export type ValidationResult = {
  isValid: boolean;
  message?: string;
};

/**
 * Validates a password based on strength criteria
 * @param password - The password to validate
 * @returns Validation result with isValid flag and optional error message
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }

  return { isValid: true };
};

/**
 * Validates a username based on format requirements
 * @param username - The username to validate
 * @returns Validation result with isValid flag and optional error message
 */
export const validateUsername = (username: string): ValidationResult => {
  if (!username) {
    return { isValid: false, message: 'Username is required' };
  }

  if (username.length < 3 || username.length > 20) {
    return { isValid: false, message: 'Username must be between 3 and 20 characters long' };
  }

  if (!/^[a-zA-Z]/.test(username)) {
    return { isValid: false, message: 'Username must start with a letter' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }

  return { isValid: true };
};

/**
 * Validates an email address
 * @param email - The email to validate
 * @returns Validation result with isValid flag and optional error message
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, message: 'Email is required' };
  }

  // Regular expression for basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  // Check that the TLD has at least 2 characters
  const tldRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!tldRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address with a proper domain' };
  }

  return { isValid: true };
};

/**
 * Options for field validation
 */
export type FieldValidationOptions = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  fieldName?: string;
  customValidator?: (value: string) => ValidationResult;
};

/**
 * Validates a field based on provided options
 * @param value - The field value to validate
 * @param options - Validation options
 * @returns Validation result with isValid flag and optional error message
 */
export const validateField = (value: string, options: FieldValidationOptions): ValidationResult => {
  const {
    required = false,
    minLength,
    maxLength,
    fieldName = 'Field',
    customValidator
  } = options;

  // Check if the field is required
  if (required && !value) {
    return { isValid: false, message: `${fieldName} is required` };
  }

  // Skip further validation if the field is empty and not required
  if (!value && !required) {
    return { isValid: true };
  }

  // Check minimum length
  if (minLength !== undefined && value.length < minLength) {
    return { 
      isValid: false, 
      message: `${fieldName} must be at least ${minLength} characters long` 
    };
  }

  // Check maximum length
  if (maxLength !== undefined && value.length > maxLength) {
    return { 
      isValid: false, 
      message: `${fieldName} must be no more than ${maxLength} characters long` 
    };
  }

  // Apply custom validator if provided
  if (customValidator) {
    return customValidator(value);
  }

  return { isValid: true };
}; 