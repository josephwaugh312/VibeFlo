// Import directly from the right paths to ensure mocking works correctly
const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Authentication middleware for testing - fixed implementation
 * that works with the test environment mocks
 */
const authenticate = (req, res, next) => {
  try {
    // Check for token in cookies or Authorization header
    let token;
    
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      const error = new Error('No auth token');
      return next(error);
    }
    
    // We need to use the callback form of jwt.verify for the mocks to work properly
    jwt.verify(token, process.env.JWT_SECRET || 'test_secret', (err, decoded) => {
      if (err) {
        return next(new Error('Invalid token'));
      }
      
      // Get user from database - must use direct query call for mocks to intercept
      db.query('SELECT * FROM users WHERE id = $1', [decoded.id])
        .then(result => {
          if (!result.rows || result.rows.length === 0) {
            return next(new Error('User not found'));
          }
          
          // Set user in request - exactly matching test expectations
          req.user = result.rows[0];
          
          // Call next without arguments
          next();
        })
        .catch(dbError => {
          return next(new Error('Error verifying user'));
        });
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { authenticate }; 