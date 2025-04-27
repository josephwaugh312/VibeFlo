import express from 'express';
import passport from '../config/passport';
import * as authController from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { generateToken } from '../utils/jwt';
import { db } from '../db';
import { User } from '../models/user.model';
import { Request, Response } from 'express';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', authenticateToken, authController.getCurrentUser);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/forgot-password', authController.requestPasswordReset);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @route   GET /api/auth/verify-reset-token/:token
 * @desc    Verify if a password reset token is valid
 * @access  Public
 */
router.get('/verify-reset-token/:token', authController.verifyResetToken);

/**
 * @route   GET /api/auth/google
 * @desc    Authenticate with Google
 * @access  Public
 */
router.get('/google', passport.authenticate('google'));

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google auth callback
 * @access  Public
 */
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed` }),
  async (req, res) => {
    try {
      if (!req.user) {
        console.error('Google auth callback: No user returned from passport');
        return res.redirect(`${process.env.CLIENT_URL}/oauth-callback?error=no_user_returned`);
      }
      
      console.log('Google auth successful, generating token');
      const user = req.user as unknown as User;
      const token = generateToken(user);
      
      // Add debug info to the response for troubleshooting
      console.log(`Redirecting to ${process.env.CLIENT_URL}/oauth-callback with token`);
      return res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${token}`);
    } catch (error) {
      console.error('Error in Google auth callback:', error);
      return res.redirect(`${process.env.CLIENT_URL}/oauth-callback?error=server_error`);
    }
  }
);

/**
 * @route   GET /api/auth/facebook
 * @desc    Authenticate with Facebook
 * @access  Public
 */
router.get('/facebook', passport.authenticate('facebook'));

/**
 * @route   GET /api/auth/facebook/callback
 * @desc    Facebook auth callback
 * @access  Public
 */
router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: `${process.env.CLIENT_URL}/login?error=facebook_auth_failed` }),
  async (req, res) => {
    try {
      if (!req.user) {
        console.error('Facebook auth callback: No user returned from passport');
        return res.redirect(`${process.env.CLIENT_URL}/oauth-callback?error=no_user_returned`);
      }
      
      console.log('Facebook auth successful, generating token');
      const user = req.user as unknown as User;
      const token = generateToken(user);
      
      // Add debug info to the response for troubleshooting
      console.log(`Redirecting to ${process.env.CLIENT_URL}/oauth-callback with token`);
      return res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${token}`);
    } catch (error) {
      console.error('Error in Facebook auth callback:', error);
      return res.redirect(`${process.env.CLIENT_URL}/oauth-callback?error=server_error`);
    }
  }
);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email
 * @access  Public
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', authController.resendVerificationEmail);

// GitHub OAuth routes
router.get('/github', passport.authenticate('github'));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: `${process.env.CLIENT_URL}/login?error=github_auth_failed` }),
  async (req, res) => {
    try {
      if (!req.user) {
        console.error('GitHub auth callback: No user returned from passport');
        return res.redirect(`${process.env.CLIENT_URL}/oauth-callback?error=no_user_returned`);
      }
      
      console.log('GitHub auth successful, generating token');
      const user = req.user as unknown as User;
      const token = generateToken(user);
      
      // Add debug info to the response for troubleshooting
      console.log(`Redirecting to ${process.env.CLIENT_URL}/oauth-callback with token`);
      return res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${token}`);
    } catch (error) {
      console.error('Error in GitHub auth callback:', error);
      return res.redirect(`${process.env.CLIENT_URL}/oauth-callback?error=server_error`);
    }
  }
);

/**
 * @route   GET /api/auth/verification-status
 * @desc    Check if user's email is verified
 * @access  Private
 */
router.get('/verification-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const result = await db.query('SELECT is_verified FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({ 
      isVerified: result.rows[0].is_verified 
    });
  } catch (error) {
    console.error('Error checking verification status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/auth/test-verification
 * @desc    Test email verification token generation
 * @access  Public - FOR TESTING ONLY
 */
router.get('/test-verification', async (req, res) => {
  try {
    // Generate verification token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hour expiry

    // Generate verification URL
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
    
    // Return verification information for testing
    res.status(200).json({
      message: 'Verification test - DO NOT USE IN PRODUCTION',
      token: verificationToken,
      expires: tokenExpiry,
      verificationUrl,
      clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
      emailConfig: {
        sendgridConfigured: !!process.env.SENDGRID_API_KEY,
        fromEmail: process.env.EMAIL_FROM || 'noreply@vibeflo.app'
      }
    });
  } catch (error) {
    console.error('Error in test verification:', error);
    res.status(500).json({ message: 'Server error during test verification' });
  }
});

// Temporary endpoint to check if a user exists
// IMPORTANT: THIS IS FOR DEBUGGING ONLY AND SHOULD BE REMOVED AFTER USE
router.get('/check-user-exists/:email', 
  async (req: Request, res: Response) => {
    try {
      const email = req.params.email;
      
      // Check if user exists
      const result = await db.query('SELECT id, email, name, username, is_verified FROM users WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
        return res.json({ exists: false, message: 'User does not exist' });
      }
      
      // Return a sanitized version with minimal information
      return res.json({ 
        exists: true, 
        user: {
          email: result.rows[0].email,
          name: result.rows[0].name,
          username: result.rows[0].username,
          is_verified: result.rows[0].is_verified
        }
      });
    } catch (error) {
      console.error('Error checking user:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router; 