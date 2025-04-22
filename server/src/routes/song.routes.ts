import express from 'express';
import * as songController from '../controllers/song.controller';
import { protect, optionalAuth } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @route   GET /api/songs/search
 * @desc    Search for songs
 * @access  Public
 */
router.get('/search', optionalAuth, songController.searchSongs);

/**
 * @route   GET /api/songs/:id
 * @desc    Get a song by ID
 * @access  Public
 */
router.get('/:id', optionalAuth, songController.getSongById);

/**
 * @route   POST /api/songs
 * @desc    Create a new song
 * @access  Private
 */
router.post('/', protect, songController.createSong);

export default router; 