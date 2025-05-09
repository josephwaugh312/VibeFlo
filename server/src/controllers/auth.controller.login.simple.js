const bcrypt = require('bcrypt');
// Don't import at the top level to allow for mocking
// const { generateToken } = require('../utils/jwt');

/**
 * Simplified login function for tests
 */
const login = async (req, res) => {
  const { email, login, password, rememberMe } = req.body;
  
  // Get the login identifier (could be email or username)
  const loginIdentifier = login || email;

  // Simple validation
  if (!loginIdentifier || !password) {
    return res.status(400).json({ message: 'Please provide email/username and password' });
  }

  try {
    // Get user from database by email or username
    const db = req.app?.locals?.db?.pool || require('../config/db');
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [loginIdentifier.toLowerCase()]
    );

    // Check if user exists
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check if password is correct - explicitly use the bcrypt module from require
    const bcryptCompare = require('bcrypt').compare;
    const isMatch = await bcryptCompare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate auth token with appropriate expiration
      // Default (rememberMe=false): 1 day token
      // Remember Me (rememberMe=true): 30 days token
      const tokenExpiration = rememberMe ? '30d' : '1d';
    
    // Get token generator function - this allows for mocking in tests
    const { generateToken } = require('../utils/jwt');
      const token = generateToken(user, tokenExpiration);

      // Remove sensitive data before sending response
      const { password: _, ...userWithoutSensitiveData } = user;

      // Set token as HTTP-only cookie
      const cookieMaxAge = rememberMe 
        ? 30 * 24 * 60 * 60 * 1000  // 30 days
        : 24 * 60 * 60 * 1000;      // 1 day
        
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: cookieMaxAge,
      });

      return res.status(200).json({
        message: 'Login successful',
        token,
        user: userWithoutSensitiveData,
      });
    } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = { login }; 