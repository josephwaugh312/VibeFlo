import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { verifiedMiddleware } from '../middleware/verified.middleware';

// Initialize router
const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(protect);

// Apply email verification middleware to all routes in this router
router.use(verifiedMiddleware);

// Basic route to test if authentication and verification are working
router.get('/status', (req, res) => {
  res.status(200).json({ 
    message: 'Protected route accessed successfully',
    user: req.user
  });
});

// No protected routes for now until controllers are properly implemented
// Add your own routes once the controllers are properly implemented

export default router; 