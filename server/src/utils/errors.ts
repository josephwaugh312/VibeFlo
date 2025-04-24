/**
 * Custom error class for application errors
 * Allows for standardized error creation with status codes and error types
 */
export class AppError extends Error {
  statusCode: number;
  code: string;
  originalError?: Error;

  constructor(message: string, statusCode = 500, errorCode = 'SERVER_ERROR', originalError?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = errorCode;
    this.originalError = originalError;
    
    // Ensure proper stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   */
  static badRequest(message = 'Bad Request', code = 'BAD_REQUEST', originalError?: Error): AppError {
    return new AppError(message, 400, code, originalError);
  }

  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED', originalError?: Error): AppError {
    return new AppError(message, 401, code, originalError);
  }

  /**
   * Create a 403 Forbidden error
   */
  static forbidden(message = 'Forbidden', code = 'FORBIDDEN', originalError?: Error): AppError {
    return new AppError(message, 403, code, originalError);
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(message = 'Not Found', code = 'NOT_FOUND', originalError?: Error): AppError {
    return new AppError(message, 404, code, originalError);
  }

  /**
   * Create a 409 Conflict error
   */
  static conflict(message = 'Conflict', code = 'CONFLICT', originalError?: Error): AppError {
    return new AppError(message, 409, code, originalError);
  }

  /**
   * Create a 422 Unprocessable Entity error
   */
  static validation(message = 'Validation Error', code = 'VALIDATION_ERROR', originalError?: Error): AppError {
    return new AppError(message, 422, code, originalError);
  }

  /**
   * Create a 500 Internal Server Error
   */
  static internal(message = 'Internal Server Error', code = 'SERVER_ERROR', originalError?: Error): AppError {
    return new AppError(message, 500, code, originalError);
  }

  /**
   * Create a 503 Service Unavailable Error
   */
  static serviceUnavailable(message = 'Service Unavailable', code = 'SERVICE_UNAVAILABLE', originalError?: Error): AppError {
    return new AppError(message, 503, code, originalError);
  }
} 