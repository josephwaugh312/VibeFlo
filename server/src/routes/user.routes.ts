import express, { Request, Response, NextFunction } from 'express';
import { protect } from '../middleware/auth.middleware';
import * as userController from '../controllers/user.controller';
import { User as UserType } from '../types';

// Extend Express Request type
declare global {
  namespace Express {
    interface User extends UserType {}
  }
}

const router = express.Router();

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, userController.getUserProfile as any);

/**
 * @route   PUT /api/users/me
 * @desc    Update user profile
 * @access  Private
 */
router.put('/me', protect, userController.updateUserProfile as any);

export default router; 