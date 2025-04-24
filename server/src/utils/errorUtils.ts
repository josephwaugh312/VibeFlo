import { AppError } from './errors';
import { handleAsync } from './errorHandler';

/**
 * Error handling utilities for common application scenarios
 * These utilities provide shortcuts for commonly encountered errors
 */

// Authentication errors
export const authErrors = {
  /**
   * User is not authenticated (no token or invalid token)
   */
  notAuthenticated: (message = 'Authentication required') => 
    AppError.unauthorized(message, 'NOT_AUTHENTICATED'),
  
  /**
   * User is authenticated but doesn't have permission
   */
  notAuthorized: (message = 'You do not have permission to perform this action') => 
    AppError.forbidden(message, 'NOT_AUTHORIZED'),
  
  /**
   * Invalid credentials (username/password)
   */
  invalidCredentials: (message = 'Invalid credentials') => 
    AppError.unauthorized(message, 'INVALID_CREDENTIALS'),
    
  /**
   * Account locked or disabled
   */
  accountLocked: (message = 'Account is locked or disabled') => 
    AppError.forbidden(message, 'ACCOUNT_LOCKED')
};

// Resource errors
export const resourceErrors = {
  /**
   * Resource not found (e.g., user, post, etc.)
   */
  notFound: (resource: string, id?: string | number) => {
    const message = id 
      ? `${resource} with ID ${id} not found` 
      : `${resource} not found`;
    return AppError.notFound(message, 'RESOURCE_NOT_FOUND');
  },
  
  /**
   * Resource already exists (e.g., user with email already exists)
   */
  alreadyExists: (resource: string, field?: string, value?: string) => {
    const message = field && value
      ? `${resource} with ${field} "${value}" already exists`
      : `${resource} already exists`;
    return AppError.conflict(message, 'RESOURCE_EXISTS');
  },
  
  /**
   * Resource is in use (e.g., cannot delete category that has items)
   */
  inUse: (resource: string) => 
    AppError.conflict(`${resource} is in use and cannot be modified/deleted`, 'RESOURCE_IN_USE')
};

// Validation errors
export const validationErrors = {
  /**
   * Required field is missing
   */
  required: (field: string) => 
    AppError.validation(`${field} is required`, 'FIELD_REQUIRED'),
  
  /**
   * Field has invalid format (e.g., email, phone, etc.)
   */
  invalidFormat: (field: string, format?: string) => {
    const message = format
      ? `${field} must be in ${format} format`
      : `${field} has invalid format`;
    return AppError.validation(message, 'INVALID_FORMAT');
  },
  
  /**
   * Value is too short (e.g., password)
   */
  tooShort: (field: string, minLength: number) => 
    AppError.validation(`${field} must be at least ${minLength} characters`, 'TOO_SHORT'),
  
  /**
   * Value is too long
   */
  tooLong: (field: string, maxLength: number) => 
    AppError.validation(`${field} must be no more than ${maxLength} characters`, 'TOO_LONG')
};

// Export for convenient imports
export { AppError, handleAsync }; 