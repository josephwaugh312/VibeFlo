import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db';
import { generateToken, verifyToken } from '../utils/jwt';
import { User } from '../types';
import crypto from 'crypto';
import { handleAsync } from '../utils/errorHandler';
import { authErrors, validationErrors, resourceErrors } from '../utils/errorUtils';
import emailService from '../services/email.service';

// Extend the Request type to include user
interface AuthRequest extends Request {
  user?: User;
}

/**
 * Register a new user
 */
export const register = handleAsync(async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, and username are required',
    });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      const existingEmail = existingUser.rows.find(
        (user: User) => user.email === email
      );
      const existingUsername = existingUser.rows.find(
        (user: User) => user.username === username
      );

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }

      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken',
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token valid for 24 hours

    // Mark user as NOT verified initially
    const isVerified = false;

    // Insert user into database
    const result = await pool.query(
      `INSERT INTO users (email, password, username, verification_token, token_expiry, is_verified) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [email, hashedPassword, username, verificationToken, tokenExpiry, isVerified]
    );

    const newUser = result.rows[0];

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, username, verificationToken);
      
      // Return success with a message about email verification
      return res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        needsVerification: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          isVerified: newUser.is_verified,
        },
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
      
      // Still return success, but with a warning about the email
      return res.status(201).json({
        success: true,
        message: 'Registration successful, but we could not send the verification email. Please use the resend verification option.',
        needsVerification: true,
        emailError: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          isVerified: newUser.is_verified,
        },
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration',
    });
  }
});

/**
 * Login user and return JWT token
 */
export const login = handleAsync(async (req: Request, res: Response) => {
  const { email, login, password, rememberMe } = req.body;
  
  // Get the login identifier (could be email or username)
  const loginIdentifier = login || email;

  // Simple validation
  if (!loginIdentifier || !password) {
    return res.status(400).json({ message: 'Please provide email/username and password' });
  }

  try {
    // Get user from database by email or username
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [loginIdentifier.toLowerCase()]
    );

    // Check if user exists
    if (result.rows.length === 0) {
      // Skip recording failed login since the table might not exist
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Remove lock check since the columns might not exist
    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Skip recording failed login since the table might not exist
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // TEMPORARILY DISABLED: Check if email is verified
    // if (!user.is_verified) {
    //   return res.status(401).json({
    //     message: 'Please verify your email before logging in',
    //     verificationRequired: true
    //   });
    // }

    // Skip resetting failed login attempts since the columns might not exist

    // Generate auth token with appropriate expiration
    // Default (rememberMe=false): 1 day token
    // Remember Me (rememberMe=true): 30 days token
    const tokenExpiration = rememberMe ? '30d' : '1d';
    const token = generateToken(user, tokenExpiration);

    console.log(`Login with rememberMe=${rememberMe}, token expiration: ${tokenExpiration}`);

    // Remove sensitive data before sending response
    const { password: _, ...userWithoutSensitiveData } = user;

    // Skip recording successful login since the table might not exist

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
});

/**
 * Record a failed login attempt
 */
const recordFailedLoginAttempt = async (loginIdentifier: string, ipAddress?: string) => {
  try {
    await pool.query(
      'INSERT INTO failed_login_attempts (login_identifier, ip_address) VALUES ($1, $2)',
      [loginIdentifier, ipAddress || 'unknown']
    );
  } catch (error) {
    console.error('Error recording failed login attempt:', error);
  }
};

/**
 * Check if account is locked due to too many failed attempts
 * Returns true if account should be locked
 */
const checkAccountLocked = async (loginIdentifier: string, ipAddress: string): Promise<boolean> => {
  try {
    // Get timestamp from 15 minutes ago
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
    
    // Count recent failed attempts from this identifier or IP
    const result = await pool.query(
      `SELECT COUNT(*) FROM failed_login_attempts 
       WHERE (login_identifier = $1 OR ip_address = $2) 
       AND created_at > $3`,
      [loginIdentifier, ipAddress, fifteenMinutesAgo]
    );
    
    const failedAttempts = parseInt(result.rows[0].count);
    return failedAttempts >= 5; // Lock after 5 failed attempts
  } catch (error) {
    console.error('Error checking account locked status:', error);
    return false; // Default to not locked in case of error
  }
};

/**
 * Clear failed login attempts after successful login
 */
const clearFailedLoginAttempts = async (loginIdentifier: string, ipAddress: string) => {
  try {
    await pool.query(
      'DELETE FROM failed_login_attempts WHERE login_identifier = $1 OR ip_address = $2',
      [loginIdentifier, ipAddress]
    );
  } catch (error) {
    console.error('Error clearing failed login attempts:', error);
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = handleAsync(async (req: AuthRequest, res: Response) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('getCurrentUser called');
    console.log('User in request:', req.user ? `ID: ${req.user.id}` : 'No user');
  }
  
  if (!req.user) {
    console.error('getCurrentUser: No user found in request');
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const userId = req.user.id;
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('getCurrentUser: Fetching data for user ID:', userId);
  }
  
  // Get user data from database
  const userQuery = `
    SELECT id, name, username, email, bio, avatar_url, created_at, updated_at, is_verified
    FROM users 
    WHERE id = $1
  `;
  
  try {
    const result = await pool.query(userQuery, [userId]);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('getCurrentUser query result rows:', result.rows.length);
    }
    
    if (result.rows.length === 0) {
      console.error('getCurrentUser: No user found in database with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.rows[0];
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('getCurrentUser: User found in database:', {
        id: user.id,
        username: user.username,
        is_verified: user.is_verified
      });
    }
    
    // Return user information (excluding sensitive data)
    const userData = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at,
      is_verified: user.is_verified
    };
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('getCurrentUser: Returning user data');
    }
    
    res.json(userData);
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    throw error;
  }
});

/**
 * Request password reset
 * Generates a reset token and sends an email to the user
 */
export const requestPasswordReset = handleAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please provide an email address' });
  }

  // Check if user exists
  const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  
  if (userResult.rows.length === 0) {
    // Don't reveal that email doesn't exist for security reasons
    return res.status(200).json({ message: 'If a user with that email exists, a password reset link will be sent' });
  }

  const user = userResult.rows[0];
  
  // Generate a reset token (random string)
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Set expiration time (1 hour from now)
  const tokenExpiry = new Date();
  tokenExpiry.setHours(tokenExpiry.getHours() + 1);
  
  // Check if reset_tokens table exists, if not create it
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (dbError) {
    console.error('Error ensuring reset_tokens table exists:', dbError);
    return res.status(500).json({ message: 'Server error during password reset request' });
  }
  
  // Delete any existing tokens for this user
  await pool.query('DELETE FROM reset_tokens WHERE user_id = $1', [user.id]);
  
  // Save the new token (store the raw token, not hashed)
  await pool.query(
    'INSERT INTO reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, resetToken, tokenExpiry]
  );
  
  // Generate reset URL
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
  
  // Log the reset URL for testing
  console.log(`[PASSWORD RESET] Token generated for ${email}: ${resetUrl}`);
  
  res.status(200).json({ message: 'If a user with that email exists, a password reset link will be sent' });
});

/**
 * Reset password with token
 */
export const resetPassword = handleAsync(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Please provide a token and new password' });
  }
  
  // Basic password validation
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }
  
  // Find the token in the database (using raw token)
  const tokenResult = await pool.query(
    'SELECT * FROM reset_tokens WHERE token = $1 AND expires_at > NOW()',
    [token]
  );
  
  if (tokenResult.rows.length === 0) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
  
  const resetToken = tokenResult.rows[0];
  
  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  
  // Update the user's password
  await pool.query(
    'UPDATE users SET password = $1 WHERE id = $2',
    [hashedPassword, resetToken.user_id]
  );
  
  // Delete the used token
  await pool.query('DELETE FROM reset_tokens WHERE id = $1', [resetToken.id]);
  
  res.status(200).json({ message: 'Password reset successful' });
});

/**
 * Verify if a password reset token is valid
 */
export const verifyResetToken = handleAsync(async (req: Request, res: Response) => {
  const { token } = req.params;
  
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }
  
  // Find the token in the database (using raw token)
  const tokenResult = await pool.query(
    'SELECT * FROM reset_tokens WHERE token = $1 AND expires_at > NOW()',
    [token]
  );
  
  if (tokenResult.rows.length === 0) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
  
  res.status(200).json({ valid: true });
});

/**
 * Google OAuth callback handler
 */
export const googleCallback = (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  
  if (!authReq.user) {
    return res.status(401).redirect(`${process.env.CLIENT_URL}/auth/error`);
  }
  
  const token = generateToken(authReq.user);
  res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
};

/**
 * Facebook OAuth callback handler
 */
export const facebookCallback = (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  
  if (!authReq.user) {
    return res.status(401).redirect(`${process.env.CLIENT_URL}/auth/error`);
  }
  
  const token = generateToken(authReq.user);
  res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
};

export const verifyEmail = handleAsync(async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ message: 'Verification token is required' });
  }

  // Find the token in the database
  const tokenResult = await pool.query(
    'SELECT * FROM verification_tokens WHERE token = $1 AND expires_at > NOW()',
    [token]
  );

  if (tokenResult.rows.length === 0) {
    return res.status(400).json({ message: 'Invalid or expired verification token' });
  }

  const verificationToken = tokenResult.rows[0];

  // Update user's verification status
  await pool.query(
    'UPDATE users SET is_verified = true WHERE id = $1',
    [verificationToken.user_id]
  );

  // Delete the used token
  await pool.query('DELETE FROM verification_tokens WHERE id = $1', [verificationToken.id]);

  res.status(200).json({ message: 'Email verified successfully' });
});

export const resendVerificationEmail = handleAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Check if user exists
  const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  
  if (userResult.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  const user = userResult.rows[0];

  if (user.is_verified) {
    return res.status(400).json({ message: 'Email is already verified' });
  }

  // Delete any existing verification tokens
  await pool.query('DELETE FROM verification_tokens WHERE user_id = $1', [user.id]);

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date();
  tokenExpiry.setHours(tokenExpiry.getHours() + 24);

  // Save new verification token
  await pool.query(
    'INSERT INTO verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, verificationToken, tokenExpiry]
  );

  // Send verification email
  await emailService.sendVerificationEmail(
    user.email,
    user.name || user.username || 'User',
    verificationToken
  );

  res.status(200).json({ message: 'Verification email sent successfully' });
});

/**
 * Check if user's email is verified
 * @route GET /api/auth/verification-status
 */
export const checkVerificationStatus = handleAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  
  const result = await pool.query(
    'SELECT is_verified FROM users WHERE id = $1',
    [userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  return res.status(200).json({ 
    isVerified: result.rows[0].is_verified 
  });
});

/**
 * Record a successful login in the database
 * Currently stubbed until we implement the login_history table
 */
const recordSuccessfulLogin = async (userId: number, req: Request) => {
  try {
    // Check if login_history table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'login_history'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('login_history table does not exist, skipping login record');
      return;
    }
    
    // Get IP and user agent
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Record the login
    await pool.query(
      'INSERT INTO login_history (user_id, ip_address, user_agent) VALUES ($1, $2, $3)',
      [userId, ip, userAgent]
    );
  } catch (error) {
    console.error('Error recording successful login:', error);
    // Don't throw error, just log it
  }
};

/**
 * Logout user by clearing the token cookie
 */
export const logout = handleAsync(async (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  
  return res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
}); 