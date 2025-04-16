/**
 * Input sanitization utilities to prevent security issues like XSS, SQL injection, etc.
 */

/**
 * Sanitizes a string to prevent XSS attacks
 * @param input The string to sanitize
 * @returns Sanitized string
 */
export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  // Replace potentially dangerous characters
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitizes a string for safe use in SQL queries
 * Note: This is a basic implementation. Always use parameterized queries for SQL.
 * @param input The string to sanitize
 * @returns Sanitized string
 */
export const sanitizeSql = (input: string): string => {
  if (!input) return '';
  
  // Remove comments and dangerous SQL characters
  return input
    .replace(/--/g, '')
    .replace(/;/g, '')
    .replace(/'/g, "''")
    .replace(/\/\*|\*\//g, '');
};

/**
 * Sanitizes object fields (only string properties)
 * @param obj The object to sanitize
 * @returns A new object with sanitized string properties
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  if (!obj) return obj;
  
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value);
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeHtml(item) : 
        (typeof item === 'object' ? sanitizeObject(item) : item)
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
};

/**
 * Sanitizes query parameters for safe use in URLs
 * @param query The query parameters to sanitize
 * @returns Sanitized query parameters
 */
export const sanitizeQueryParams = (query: Record<string, any>): Record<string, string> => {
  const result: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(query)) {
    // Skip null or undefined values
    if (value === null || value === undefined) continue;
    
    // Convert to string and sanitize
    const strValue = typeof value === 'string' ? value : String(value);
    result[key] = sanitizeHtml(strValue);
  }
  
  return result;
};

/**
 * Validates and sanitizes an email address
 * @param email The email to sanitize
 * @returns Sanitized email or empty string if invalid
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return '';
  
  // Remove any HTML and limit to 254 characters (RFC 5321)
  return sanitizeHtml(email.trim()).slice(0, 254);
};

export default {
  sanitizeHtml,
  sanitizeSql,
  sanitizeObject,
  sanitizeQueryParams,
  sanitizeEmail
}; 