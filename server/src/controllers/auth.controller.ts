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
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email, passwordLength: password?.length });

  if (!email) throw validationErrors.required('Email');
  if (!password) throw validationErrors.required('Password');

  // Query based on whether the login is an email or username
  const queryText = 'SELECT * FROM users WHERE email = $1';
  
  console.log('Query:', queryText, 'Parameter:', email);
  
  const userResult = await pool.query(queryText, [email]);
  
  console.log('User found:', userResult.rows.length > 0, 'User details:', userResult.rows.length > 0 ? { 
    id: userResult.rows[0].id,
    email: userResult.rows[0].email,
    username: userResult.rows[0].username,
    passwordHash: userResult.rows[0].password?.substring(0, 10) + '...'
  } : 'No user found');
  
  if (userResult.rows.length === 0) {
    // Record the failed attempt
    await recordFailedLoginAttempt(email);
    console.log('User not found with login:', email);
    throw authErrors.invalidCredentials();
  }
  
  const user = userResult.rows[0];
  
  // Check if account is locked
  if (user.is_locked) {
    const lockExpiryTime = new Date(user.lock_expires);
    if (lockExpiryTime > new Date()) {
      // Account is still locked
      const timeRemaining = Math.ceil((lockExpiryTime.getTime() - Date.now()) / (1000 * 60));
      console.log('Account is locked, time remaining:', timeRemaining, 'minutes');
      throw authErrors.accountLocked(`Account is temporarily locked. Please try again in ${timeRemaining} minute(s).`);
    } else {
      // Lock has expired, reset the lock status
      console.log('Lock expired, resetting lock status');
      await pool.query('UPDATE users SET is_locked = false, failed_login_attempts = 0 WHERE id = $1', [user.id]);
    }
  }
  
  // Check if password matches
  console.log('Checking password with bcrypt...');
  
  // Try bcrypt compare first
  let isMatch = false;
  try {
    if (user.password.startsWith('$2')) {
      // It's a bcrypt hash, use bcrypt.compare
      isMatch = await bcrypt.compare(password, user.password);
    } else if (process.env.NODE_ENV === 'development') {
      // DEVELOPMENT ONLY: Allow plaintext password comparison for debugging
      console.log('DEVELOPMENT MODE: Comparing plaintext passwords');
      isMatch = (password === user.password);
    }
  } catch (err) {
    console.error('Error comparing passwords:', err);
    // Continue with isMatch = false
  }
  
  console.log('Password match result:', isMatch);
  
  if (!isMatch) {
    // Record the failed attempt
    await recordFailedLoginAttempt(email);
    console.log('Password does not match');
    throw authErrors.invalidCredentials();
  }
  
  // Reset failed login attempts on successful login
  if (user.failed_login_attempts > 0) {
    console.log('Resetting failed login attempts');
    await pool.query('UPDATE users SET failed_login_attempts = 0 WHERE id = $1', [user.id]);
  }
  
  // Check if email is verified
  if (!user.is_verified) {
    return res.status(401).json({
      success: false,
      message: 'Please verify your email before logging in',
      needsVerification: true,
      email: user.email
    });
  }
  
  // Generate JWT token
  console.log('Generating JWT token');
  const token = generateToken(user);
  
  // Set token in HTTP-only cookie
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });
  
  console.log('Login successful for user:', user.email);
  
  // Return user information (excluding sensitive data)
  res.status(200).json({
    message: 'Login successful',
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      created_at: user.created_at,
      updated_at: user.updated_at
    },
    token
  });
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
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const userId = req.user.id;
  
  // Get user data from database
  const userQuery = `
    SELECT id, name, username, email, bio, avatar_url, created_at, updated_at 
    FROM users 
    WHERE id = $1
  `;
  const result = await pool.query(userQuery, [userId]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  const user = result.rows[0];
  
  // Return user information (excluding sensitive data)
  res.json({
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatar_url,
    created_at: user.created_at,
    updated_at: user.updated_at
  });
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