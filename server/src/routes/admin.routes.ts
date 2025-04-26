import express from 'express';
import { isAdmin } from '../middleware/admin.middleware';
import { isAuthenticated } from '../middleware/auth.middleware';

const router = express.Router();

// Protected routes that require admin privileges
router.use(isAuthenticated); // First check if user is authenticated
router.use(isAdmin); // Then check if user is an admin

// Admin routes go here
// Example: router.get('/users', adminController.getAllUsers);

export default router; 