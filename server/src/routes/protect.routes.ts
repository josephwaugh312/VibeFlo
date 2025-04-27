import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware';
import { isVerified } from '../middleware/verified.middleware';

// Import controllers - add your own as needed
import themeController from '../controllers/theme.controller';
import playlistController from '../controllers/playlist.controller';
import noteController from '../controllers/note.controller';
import pomodoroController from '../controllers/pomodoro.controller';

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(isAuthenticated);

// Routes that require authentication but not email verification
// For example, profile viewing

// Apply email verification middleware to routes that require it
router.use('/themes/create', isVerified);
router.use('/themes/update', isVerified);
router.use('/themes/delete', isVerified);

router.use('/playlists/create', isVerified);
router.use('/playlists/update', isVerified);
router.use('/playlists/delete', isVerified);

router.use('/notes', isVerified);
router.use('/pomodoro', isVerified);

// Define your routes here
// Theme routes
router.post('/themes/create', themeController.createTheme);
router.put('/themes/update/:id', themeController.updateTheme);
router.delete('/themes/delete/:id', themeController.deleteTheme);

// Playlist routes
router.post('/playlists/create', playlistController.createPlaylist);
router.put('/playlists/update/:id', playlistController.updatePlaylist);
router.delete('/playlists/delete/:id', playlistController.deletePlaylist);

// Note routes
router.get('/notes', noteController.getNotes);
router.post('/notes', noteController.createNote);
router.put('/notes/:id', noteController.updateNote);
router.delete('/notes/:id', noteController.deleteNote);

// Pomodoro routes
router.get('/pomodoro', pomodoroController.getSettings);
router.post('/pomodoro', pomodoroController.saveSettings);
router.get('/pomodoro/sessions', pomodoroController.getSessions);
router.post('/pomodoro/sessions', pomodoroController.saveSession);

export default router; 