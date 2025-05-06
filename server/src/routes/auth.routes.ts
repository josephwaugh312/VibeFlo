import express from 'express';
import passport from '../config/passport';
import * as authController from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { generateToken } from '../utils/jwt';
import pool from '../config/db';
import { User } from '../models/user.model';
import { Request, Response } from 'express';
import sgMail from '@sendgrid/mail';

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
    
    const result = await pool.query('SELECT is_verified FROM users WHERE id = $1', [userId]);
    
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
      const result = await pool.query('SELECT id, email, name, username, is_verified FROM users WHERE email = $1', [email]);
      
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

// Temporary endpoint to check and delete a user - REMOVE AFTER DEBUGGING
// This requires a special debug key to prevent unauthorized access
router.delete('/debug/user/:email', async (req: Request, res: Response) => {
  try {
    // Basic security check to prevent unauthorized access
    const debugKey = req.headers['x-debug-key'];
    if (debugKey !== process.env.DEBUG_KEY && debugKey !== 'temporaryDebugKey123') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const email = req.params.email;
    
    // Check if user exists
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    // Delete associated records first to maintain referential integrity
    // Delete verification tokens
    await pool.query('DELETE FROM verification_tokens WHERE user_id = $1', [userId]);
    
    // Delete login history if it exists
    try {
      await pool.query('DELETE FROM login_history WHERE user_id = $1', [userId]);
    } catch (err) {
      // Ignore if table doesn't exist
      console.log('Note: login_history table may not exist', err.message);
    }
    
    // Delete any other related records as needed
    // ...
    
    // Finally delete the user
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    
    return res.json({ 
      success: true, 
      message: 'User and related records deleted successfully',
      email
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/test-verification', async (req, res) => {
  try {
    await sgMail.send({
      to: 'joseph.waugh312@gmail.com',
      from: 'noreply@vibeflo.app',
      subject: 'SendGrid Test',
      text: 'Testing SendGrid configuration',
      html: '<p>Testing SendGrid configuration</p>'
    });
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    console.error('SendGrid test failed:', error);
    if (error.response) {
      console.error('SendGrid API Response:', {
        statusCode: error.response.statusCode,
        body: error.response.body,
        headers: error.response.headers
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test email',
      error: error.response ? error.response.body : error.message
    });
  }
});

// Add a route for OAuth configuration checking
/**
 * @route   GET /api/auth/config-check
 * @desc    Check OAuth configuration
 * @access  Public
 */
router.get('/config-check', (req, res) => {
  try {
    // Get environment variables
    const config = {
      SERVER_URL: process.env.SERVER_URL || 'Not set',
      CLIENT_URL: process.env.CLIENT_URL || 'Not set',
      
      // Google OAuth - mask secrets partially
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 
        `${process.env.GOOGLE_CLIENT_ID.substring(0, 5)}...${process.env.GOOGLE_CLIENT_ID.substring(process.env.GOOGLE_CLIENT_ID.length - 5)}` : 
        'Not set',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 
        `${process.env.GOOGLE_CLIENT_SECRET.substring(0, 3)}...${process.env.GOOGLE_CLIENT_SECRET.substring(process.env.GOOGLE_CLIENT_SECRET.length - 3)}` : 
        'Not set',
      GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      
      // GitHub OAuth - mask secrets partially
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? 
        `${process.env.GITHUB_CLIENT_ID.substring(0, 5)}...${process.env.GITHUB_CLIENT_ID.substring(process.env.GITHUB_CLIENT_ID.length - 5)}` : 
        'Not set',
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? 
        `${process.env.GITHUB_CLIENT_SECRET.substring(0, 3)}...${process.env.GITHUB_CLIENT_SECRET.substring(process.env.GITHUB_CLIENT_SECRET.length - 3)}` : 
        'Not set',
      GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback',
      
      // Calculate the effective callback URLs
      effectiveGoogleCallback: process.env.GOOGLE_CALLBACK_URL?.startsWith('http') 
        ? process.env.GOOGLE_CALLBACK_URL 
        : `${process.env.SERVER_URL || 'https://vibeflo-api.onrender.com'}${process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'}`,
      
      effectiveGithubCallback: process.env.GITHUB_CALLBACK_URL?.startsWith('http')
        ? process.env.GITHUB_CALLBACK_URL
        : `${process.env.SERVER_URL || 'https://vibeflo-api.onrender.com'}${process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback'}`,
      
      // Additional flags
      isProduction: process.env.NODE_ENV === 'production',
      isTest: process.env.NODE_ENV === 'test',
      isDevelopment: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
    };
    
    res.json({
      success: true,
      message: 'OAuth configuration check',
      config
    });
  } catch (error) {
    console.error('Error in OAuth config check:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking OAuth configuration',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/google/url
 * @desc    Get Google auth URL for testing
 * @access  Public
 */
router.get('/google/url', (req, res) => {
  try {
    // Check if passport and the Google strategy are properly configured
    const strategies = (passport as any)._strategies || {};
    if (!strategies.google) {
      return res.status(500).json({
        success: false,
        message: 'Google authentication is not configured'
      });
    }
    
    // Build the authorization URL manually
    const googleStrategy = strategies.google;
    const authUrl = googleStrategy._oauth2.getAuthorizeUrl({
      redirect_uri: googleStrategy._callbackURL,
      scope: googleStrategy._scope,
      response_type: 'code',
      state: Math.random().toString(36).substring(2, 15)
    });
    
    res.json({
      success: true,
      authUrl,
      callbackUrl: googleStrategy._callbackURL,
      scope: googleStrategy._scope
    });
  } catch (error) {
    console.error('Error getting Google auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating Google auth URL',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/github/url
 * @desc    Get GitHub auth URL for testing
 * @access  Public
 */
router.get('/github/url', (req, res) => {
  try {
    // Check if passport and the GitHub strategy are properly configured
    const strategies = (passport as any)._strategies || {};
    if (!strategies.github) {
      return res.status(500).json({
        success: false,
        message: 'GitHub authentication is not configured'
      });
    }
    
    // Build the authorization URL manually
    const githubStrategy = strategies.github;
    const authUrl = githubStrategy._oauth2.getAuthorizeUrl({
      redirect_uri: githubStrategy._callbackURL,
      scope: githubStrategy._scope,
      response_type: 'code',
      state: Math.random().toString(36).substring(2, 15)
    });
    
    res.json({
      success: true,
      authUrl,
      callbackUrl: githubStrategy._callbackURL,
      scope: githubStrategy._scope
    });
  } catch (error) {
    console.error('Error getting GitHub auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating GitHub auth URL',
      error: error.message
    });
  }
});

export default router; 