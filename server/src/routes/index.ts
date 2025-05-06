import express from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import playlistRoutes from './playlist.routes';
import songRoutes from './song.routes';
import youtubeRoutes from './youtube.routes';
import themeRoutes from './theme.routes';
import settingsRoutes from './settings.routes';
import pomodoroRoutes from './pomodoro.routes';
import moderationRoutes from './moderation.routes';
import protectRoutes from './protect.routes';
import migrationRoutes from './migration.routes';
import adminRoutes from './admin.routes';

const router = express.Router();

// Health check endpoint for testing
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/playlists', playlistRoutes);
router.use('/songs', songRoutes);
router.use('/youtube', youtubeRoutes);
router.use('/themes', themeRoutes);
router.use('/settings', settingsRoutes);
router.use('/pomodoro', pomodoroRoutes);
router.use('/moderation', moderationRoutes);
router.use('/protect', protectRoutes);
router.use('/migrations', migrationRoutes);
router.use('/admin', adminRoutes);

export default router; 