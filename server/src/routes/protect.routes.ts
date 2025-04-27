import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware';
import { isVerified } from '../middleware/verified.middleware';

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(isAuthenticated);

// Routes that require authentication but not email verification
router.get('/status', (req, res) => {
  res.status(200).json({ message: 'Protected API is working', authenticated: true });
});

// No protected routes for now until controllers are properly implemented
// Add your own routes once the controllers are properly implemented

export default router; 