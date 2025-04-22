import express from 'express';
import passport from '../config/passport';
import * as authController from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { generateToken } from '../utils/jwt';
import { db } from '../db';
import { User } from '../models/user.model';

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

export default router; 