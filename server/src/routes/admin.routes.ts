import express from 'express';
import { isAdmin } from '../middleware/admin.middleware';
import { isAuthenticated } from '../middleware/auth.middleware';
import pool from '../config/db';

const router = express.Router();

// Protected routes that require admin privileges
router.use(isAuthenticated); // First check if user is authenticated
router.use(isAdmin); // Then check if user is an admin

// Admin routes go here
// Example: router.get('/users', adminController.getAllUsers);

// Debug endpoint to delete a test user
router.delete('/debug/users', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Delete user from the database
    const result = await pool.query('DELETE FROM users WHERE email = $1 RETURNING *', [email]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({ 
      message: 'User deleted successfully',
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email
      }
    });
  } catch (error) {
    console.error('Error deleting test user:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router; 