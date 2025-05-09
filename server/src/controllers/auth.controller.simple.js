/**
 * Simple auth controller for testing
 * This implementation doesn't use handleAsync for better testability
 */

/**
 * Login user and return JWT token
 * Simplified version for testing without handleAsync
 */
const login = async (req, res) => {
  const { email, login, password } = req.body;
  
  // Get the login identifier (could be email or username)
  const loginIdentifier = login || email;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'Please provide email/username and password' 
    });
  }

  try {
    // Get user from database by email or username
    const result = await req.app.locals.db.pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [loginIdentifier.toLowerCase()]
    );

    // Check if user exists
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const user = result.rows[0];

    // Check if password is correct
    const isMatch = await require('bcrypt').compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check if email is verified
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
        verificationRequired: true
      });
    }

    // Generate auth token
    const token = require('../utils/jwt').generateToken(user, '1d');

    // Remove sensitive data before sending response
    const { password: _, ...userWithoutSensitiveData } = user;

    // Set token as cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return res.status(200).json({
      success: true,
      userId: user.id,
      username: user.username
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
};

/**
 * Get the current authenticated user
 * Simplified version for testing without handleAsync
 */
const getCurrentUser = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user.id;
    
    // For database access in tests
    const dbPool = req.app?.locals?.db || require('../config/db');
    
    // Get user data from database
    const result = await dbPool.query(
      `SELECT id, name, username, email, profile_picture, avatar_url, 
      is_verified, is_admin, bio, created_at 
      FROM users WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Transform user data
    const userData = result.rows[0];
    
    // Transform is_verified to isVerified for frontend consistency
    if ('is_verified' in userData) {
      userData.isVerified = userData.is_verified;
      delete userData.is_verified;
    }
    
    return res.json(userData);
  } catch (error) {
    console.error('Error getting current user:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login,
  getCurrentUser
}; 