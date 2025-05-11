import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { User } from '../types';
import jwt from 'jsonwebtoken';
import db from '../config/db';

// Extend the Request type to include user
export interface AuthRequest extends Request {
  user?: User;
}

// Interface for decoded token
interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

/**
 * Middleware to protect routes requiring authentication
 */
export const protect = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Protect middleware - Request path:', req.path);
    console.log('Protect middleware - Auth header:', req.headers.authorization ? 'Present' : 'Missing');
  }
  
  passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
    // If there's an error from Passport or JWT verification
    if (err) {
      const statusCode = err.statusCode || 500;
      const errorMessage = err.message || 'Authentication error';
      const errorCode = err.code || 'AUTH_ERROR';
      
      console.log(`Authentication error [${errorCode}]: ${errorMessage}`);
      
      // Create or enhance the error object
      const enhancedError: any = new Error(errorMessage);
      enhancedError.statusCode = statusCode;
      enhancedError.code = errorCode;
      enhancedError.originalError = err;
      
      return next(enhancedError);
    }

    // If no user was found or token was invalid
    if (!user) {
      // Get authorization header to check if token was provided
      const authHeader = req.headers.authorization || '';
      const hasToken = authHeader.startsWith('Bearer ');
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Protect middleware - No user found');
        console.log('Protect middleware - Has token:', hasToken);
        if (hasToken) {
          const token = authHeader.split(' ')[1];
          console.log('Protect middleware - Token preview:', token.substring(0, 10) + '...');
        }
      }
      
      const error: any = new Error(
        hasToken 
          ? 'Invalid authentication token'
          : 'No authentication token provided'
      );
      error.statusCode = 401;
      error.code = hasToken ? 'INVALID_TOKEN' : 'MISSING_TOKEN';
      
      console.log(`Authentication failed: ${error.code} - ${error.message}`);
      return next(error);
    }

    // Authentication successful
    if (process.env.NODE_ENV !== 'production') {
      console.log('Protect middleware - Authentication successful');
      console.log('Protect middleware - User ID:', user.id);
    }
    
    (req as AuthRequest).user = user;
    next();
  })(req, res, next);
};

/**
 * Optional authentication - will set user if token is valid but won't block the request if not
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
    if (err) {
      // Log the error but don't block the request
      console.log(`Optional auth error: ${err.message}`);
    }
    
    if (user) {
      (req as AuthRequest).user = user;
    }
    next();
  })(req, res, next);
};

// Auth middleware to verify JWT token
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing. Please log in.' });
    }
    
    // Verify and decode token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key'
    ) as DecodedToken;
    
    // Check if user exists in the database - Using query method instead of select
    const result = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    const userResult = result.rows[0];
    
    if (!userResult) {
      return res.status(401).json({ message: 'User not found. Please register or log in.' });
    }
    
    // Add user to request for use in following middleware
    req.user = userResult;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token. Please log in again.' });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token has expired. Please log in again.' });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Server error during authentication.' });
  }
}; 