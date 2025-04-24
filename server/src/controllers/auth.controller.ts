import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db';
import { generateToken, verifyToken } from '../utils/jwt';
import { User } from '../types';
import crypto from 'crypto';
import { sendVerificationEmail } from '../services/email.service';
import { handleAsync } from '../utils/errorHandler';

// Extend the Request type to include user
interface AuthRequest extends Request {
  user?: User;
}

/**
 * Register a new user
 */
export const register = handleAsync(async (req: Request, res: Response) => {
  const { name, username, email, password } = req.body;

  // Check if required fields are provided
  if (!name || !username || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, username, email, and password' });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  // Check for at least one uppercase letter, one lowercase letter, and one number
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return res.status(400).json({ 
      message: 'Password must include at least one uppercase letter, one lowercase letter, and one number' 
    });
  }

  // Check if user with this email already exists
  const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (emailCheck.rows.length > 0) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  // Check if user with this username already exists
  const usernameCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  if (usernameCheck.rows.length > 0) {
    return res.status(400).json({ message: 'Username is already taken' });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create new user
  const newUser = await pool.query(
    'INSERT INTO users (name, username, email, password, is_verified) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, username, email, hashedPassword, false]
  );

  const user = newUser.rows[0];

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date();
  tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hour expiry

  // Save verification token
  await pool.query(
    'INSERT INTO verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, verificationToken, tokenExpiry]
  );

  // Generate verification URL
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;

  // Try to send verification email but don't block registration if it fails
  try {
    await sendVerificationEmail(email, verificationUrl);
    console.log(`Verification email sent to ${email}`);
  } catch (emailError) {
    console.error('Error sending verification email:', emailError);
    // Don't fail registration if email sending fails
    // Just log it and continue

    // Set user as verified even if email fails
    await pool.query('UPDATE users SET is_verified = TRUE WHERE id = $1', [user.id]);
  }

  // Generate JWT token
  const token = generateToken(user);

  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      profile_picture: user.profile_picture,
      is_verified: user.is_verified
    },
    token,
    message: 'Registration successful. Please check your email to verify your account.'
  });
});

/**
 * Login user and return JWT token
 */
export const login = handleAsync(async (req: Request, res: Response) => {
  const { login, password } = req.body;
  
  console.log('Login attempt:', { login, passwordLength: password?.length });

  if (!login || !password) {
    console.log('Missing login or password');
    return res.status(400).json({ message: 'Please provide both login and password' });
  }

  const isEmail = login.includes('@');
  
  // Query based on whether the login is an email or username
  const queryText = isEmail 
    ? 'SELECT * FROM users WHERE email = $1' 
    : 'SELECT * FROM users WHERE username = $1';
  
  console.log('Query:', queryText, 'Parameter:', login);
  
  const userResult = await pool.query(queryText, [login]);
  
  console.log('User found:', userResult.rows.length > 0, 'User details:', userResult.rows.length > 0 ? { 
    id: userResult.rows[0].id,
    email: userResult.rows[0].email,
    username: userResult.rows[0].username,
    passwordHash: userResult.rows[0].password?.substring(0, 10) + '...'
  } : 'No user found');
  
  if (userResult.rows.length === 0) {
    // Record the failed attempt
    await recordFailedLoginAttempt(login);
    console.log('User not found with login:', login);
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  const user = userResult.rows[0];
  
  // Check if account is locked
  if (user.is_locked) {
    const lockExpiryTime = new Date(user.lock_expires);
    if (lockExpiryTime > new Date()) {
      // Account is still locked
      const timeRemaining = Math.ceil((lockExpiryTime.getTime() - Date.now()) / (1000 * 60));
      console.log('Account is locked, time remaining:', timeRemaining, 'minutes');
      return res.status(401).json({ 
        message: `Account is temporarily locked. Please try again in ${timeRemaining} minute(s).`
      });
    } else {
      // Lock has expired, reset the lock status
      console.log('Lock expired, resetting lock status');
      await pool.query('UPDATE users SET is_locked = false, failed_login_attempts = 0 WHERE id = $1', [user.id]);
    }
  }
  
  // Check if password matches
  console.log('Checking password with bcrypt...');
  console.log('Password from request:', password);
  console.log('Password hash from DB:', user.password);
  
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
    await recordFailedLoginAttempt(login);
    console.log('Password does not match');
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Reset failed login attempts on successful login
  if (user.failed_login_attempts > 0) {
    console.log('Resetting failed login attempts');
    await pool.query('UPDATE users SET failed_login_attempts = 0 WHERE id = $1', [user.id]);
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

  // Generate verification URL
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;

  // Send verification email
  await sendVerificationEmail(email, verificationUrl);

  res.status(200).json({ message: 'Verification email sent successfully' });
}); 