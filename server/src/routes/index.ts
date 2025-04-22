import express from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import pomodoroRoutes from './pomodoro.routes';
import playlistRoutes from './playlist.routes';
import songRoutes from './song.routes';
import settingsRoutes from './settings.routes';
import themeRoutes from './theme.routes';
import moderationRoutes from './moderation.routes';
import migrationRoutes from './migration.routes';

const router = express.Router();

// Mount the different route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/pomodoro', pomodoroRoutes);
router.use('/playlists', playlistRoutes);
router.use('/songs', songRoutes);
router.use('/settings', settingsRoutes);
router.use('/themes', themeRoutes);
router.use('/moderation', moderationRoutes);
router.use('/migrations', migrationRoutes);

export default router; 