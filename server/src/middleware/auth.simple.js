const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Authentication middleware for testing
 * Verifies JWT token from cookie or Authorization header
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
    
    // Verify token
    jwt.verify(token, process.env.JWT_SECRET || 'test_secret', (err, decoded) => {
      if (err) {
        return next(new Error('Invalid token'));
      }
      
      // Get user from database - using promise directly without await
      db.query('SELECT * FROM users WHERE id = $1', [decoded.id])
        .then(result => {
          if (!result.rows || result.rows.length === 0) {
            return next(new Error('User not found'));
          }
          
          // Set user in request
          req.user = result.rows[0];
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