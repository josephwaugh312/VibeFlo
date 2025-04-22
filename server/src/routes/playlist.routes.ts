import express from 'express';
import * as playlistController from '../controllers/playlist.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @route   GET /api/playlists
 * @desc    Get all playlists for the current user
 * @access  Private
 */
router.get('/', protect, playlistController.getUserPlaylists);

/**
 * @route   GET /api/playlists/:id
 * @desc    Get a playlist by ID
 * @access  Private
 */
router.get('/:id', protect, playlistController.getPlaylistById);

/**
 * @route   POST /api/playlists
 * @desc    Create a new playlist
 * @access  Private
 */
router.post('/', protect, playlistController.createPlaylist);

/**
 * @route   PUT /api/playlists/:id
 * @desc    Update a playlist
 * @access  Private
 */
router.put('/:id', protect, playlistController.updatePlaylist);

/**
 * @route   DELETE /api/playlists/:id
 * @desc    Delete a playlist
 * @access  Private
 */
router.delete('/:id', protect, playlistController.deletePlaylist);

/**
 * @route   GET /api/playlists/:playlistId/songs
 * @desc    Get all songs in a playlist
 * @access  Private
 */
router.get('/:playlistId/songs', protect, playlistController.getPlaylistSongs);

/**
 * @route   POST /api/playlists/:playlistId/songs
 * @desc    Add a song to a playlist
 * @access  Private
 */
router.post('/:playlistId/songs', protect, playlistController.addSongToPlaylist);

/**
 * @route   DELETE /api/playlists/:playlistId/songs/:songId
 * @desc    Remove a song from a playlist
 * @access  Private
 */
router.delete('/:playlistId/songs/:songId', protect, playlistController.removeSongFromPlaylist);

export default router; 