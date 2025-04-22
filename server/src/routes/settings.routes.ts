import express from 'express';
import * as settingsController from '../controllers/settings.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @route   GET /api/settings
 * @desc    Get user settings
 * @access  Private
 */
router.get('/', protect, settingsController.getUserSettings);

/**
 * @route   PUT /api/settings
 * @desc    Update user settings
 * @access  Private
 */
router.put('/', protect, settingsController.updateUserSettings);

export default router; 