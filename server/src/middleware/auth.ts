import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Authentication middleware to verify JWT tokens
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Auth middleware - Request path:', req.path);
      console.log('Auth middleware - Auth header present:', !!authHeader);
    }
    
    if (!authHeader) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }
    
    // Extract token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Auth middleware - Token present:', !!token);
      if (token) {
        // Only show first 10 chars for security
        console.log('Auth middleware - Token preview:', token.substring(0, 10) + '...');
      }
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Invalid authentication token format' });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Auth middleware - Token decoded successfully');
        console.log('Auth middleware - User ID:', (decoded as any).id);
      }
      
      // Add user data to request
      (req as any).user = decoded;
      
      // Continue to next middleware
      next();
    } catch (jwtError: any) {
      console.error('JWT verification error:', jwtError.message);
      
      // Different error messages based on error type
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Authentication token has expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Invalid authentication token',
          code: 'INVALID_TOKEN'
        });
      } else {
        return res.status(401).json({ 
          message: 'Authentication error',
          code: 'AUTH_ERROR'
        });
      }
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ message: 'Server error during authentication' });
  }
}; 