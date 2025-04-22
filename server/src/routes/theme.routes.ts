import express from 'express';
import { protect as authenticateToken } from '../middleware/auth.middleware';
import * as themeController from '../controllers/theme.controller';

const router = express.Router();

/**
 * @route   GET /api/themes/custom/public
 * @desc    Get all public custom themes
 * @access  Public
 */
router.get('/custom/public', themeController.getPublicCustomThemes);

/**
 * @route   GET /api/themes/custom/user
 * @desc    Get user's custom themes
 * @access  Private
 */
router.get('/custom/user', authenticateToken, themeController.getUserCustomThemes);

/**
 * @route   POST /api/themes/custom
 * @desc    Create a new custom theme
 * @access  Private
 */
router.post('/custom', authenticateToken, themeController.createCustomTheme);

/**
 * @route   PUT /api/themes/custom/:id
 * @desc    Update a custom theme
 * @access  Private
 */
router.put('/custom/:id', authenticateToken, themeController.updateCustomTheme);

/**
 * @route   DELETE /api/themes/custom/:id
 * @desc    Delete a custom theme
 * @access  Private
 */
router.delete('/custom/:id', authenticateToken, themeController.deleteCustomTheme);

/**
 * @route   PUT /api/themes/user
 * @desc    Set user's active theme
 * @access  Private
 */
router.put('/user', authenticateToken, themeController.setUserTheme);

/**
 * @route   GET /api/themes/user
 * @desc    Get user's active theme
 * @access  Private
 */
router.get('/user', authenticateToken, themeController.getUserTheme);

/**
 * @route   GET /api/themes
 * @desc    Get all available themes
 * @access  Public
 */
router.get('/', themeController.getAllThemes);

/**
 * @route   GET /api/themes/:id
 * @desc    Get a theme by ID
 * @access  Public
 */
router.get('/:id', themeController.getThemeById);

export default router; 