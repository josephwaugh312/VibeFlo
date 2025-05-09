/**
 * Get current authenticated user - simplified version for tests
 */
const getCurrentUser = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const userId = req.user.id;
  
  try {
    // Use either db connection from app.locals (for tests) or from imported pool
    const db = req.app?.locals?.db?.pool || require('../config/db');
    
    // Query for user data
    const result = await db.query(
      `SELECT id, name, username, email, bio, avatar_url, created_at, updated_at, is_verified
       FROM users 
       WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // Format the user data to match expected format
    const userData = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at,
      is_verified: user.is_verified
    };
    
    res.json(userData);
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCurrentUser
}; 