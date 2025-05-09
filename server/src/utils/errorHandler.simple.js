/**
 * Simple error handler middleware for testing
 * Handles different error types and sends appropriate responses
 */
const handleError = (err, req, res, next) => {
  // Check if error is a JWT error - pass it to next middleware
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return next(err);
  }
  
  // Get error status code, default to 500
  const statusCode = err.statusCode || 500;
  
  // Get error message
  const message = err.message || 'Server error';
  
  // Set response status and send error message
  res.status(statusCode).json({
    message: message
  });
};

module.exports = { handleError }; 