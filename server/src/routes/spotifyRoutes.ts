import express from 'express';
import { spotifyController } from '../controllers/spotifyController';
import { spotifyAuth } from '../middleware/auth';

const router = express.Router();

// Public endpoints (no auth required)
router.post('/exchange-token', spotifyController.exchangeToken);
router.post('/refresh-token', spotifyController.refreshToken);

// Protected endpoints (use spotifyAuth middleware for now)
router.post('/profile', spotifyAuth, spotifyController.getUserProfile);
router.post('/playlists', spotifyAuth, spotifyController.getUserPlaylists);
router.post('/playlist-tracks', spotifyAuth, spotifyController.getPlaylistTracks);
router.post('/search', spotifyAuth, spotifyController.searchTracks);

export default router; 