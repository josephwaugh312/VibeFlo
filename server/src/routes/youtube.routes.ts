import express from 'express';
import { protect } from '../middleware/auth.middleware';
import youtubeService from '../services/youtube.service';

const router = express.Router();

/**
 * @route   GET /api/youtube/search
 * @desc    Search for YouTube videos
 * @access  Private
 */
router.get('/search', protect, async (req, res) => {
  try {
    const { query, maxResults } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const results = await youtubeService.searchVideos(
      query as string,
      maxResults ? parseInt(maxResults as string) : 10
    );
    
    res.json(results);
  } catch (error) {
    console.error('Error in YouTube search route:', error);
    res.status(500).json({ message: 'Error searching YouTube' });
  }
});

/**
 * @route   GET /api/youtube/video/:id
 * @desc    Get details for a specific YouTube video
 * @access  Private
 */
router.get('/video/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Video ID is required' });
    }

    const videoDetails = await youtubeService.getVideoDetails(id);
    res.json(videoDetails);
  } catch (error) {
    console.error('Error in YouTube video details route:', error);
    res.status(500).json({ message: 'Error fetching video details' });
  }
});

export default router; 