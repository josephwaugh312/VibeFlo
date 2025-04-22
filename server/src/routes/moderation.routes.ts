import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';
import { 
  getPendingThemes,
  approveTheme,
  rejectTheme,
  reportTheme,
  getReportedThemes
} from '../controllers/theme-moderation.controller';

const router = express.Router();

// Public routes - none

// Protected routes - require authentication
router.post('/themes/:themeId/report', protect, reportTheme);

// Admin routes - require admin privileges
router.get('/admin/themes/pending', protect, isAdmin, getPendingThemes);
router.get('/admin/themes/reported', protect, isAdmin, getReportedThemes);
router.post('/admin/themes/:themeId/approve', protect, isAdmin, approveTheme);
router.post('/admin/themes/:themeId/reject', protect, isAdmin, rejectTheme);

export default router; 