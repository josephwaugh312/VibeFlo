import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../types';
import { AppError } from './errors';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

if (process.env.NODE_ENV !== 'production') {
  // In development, warn if using fallback secret
  if (JWT_SECRET === 'fallback_jwt_secret') {
    console.warn('WARNING: Using fallback JWT_SECRET. Set JWT_SECRET in your .env file for security.');
  } else {
    console.log('JWT_SECRET is properly configured');
  }
}

/**
 * Generate a JWT token for a user
 * @param {User} user - User object from database
 * @param {String} [expiresIn] - Custom expiration time for the token
 * @returns {String} JWT token
 */
export const generateToken = (user: User, expiresIn?: string): string => {
  const expirationTime = expiresIn || JWT_EXPIRES_IN;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Generating token for user ID: ${user.id}`);
  }
  
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    role: user.role || 'user',
    is_admin: user.is_admin || false
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: expirationTime });
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Token generated successfully. Preview: ${token.substring(0, 20)}...`);
    
    // Decode and log the token payload for debugging
    const decoded = jwt.decode(token);
    console.log('Token payload:', decoded);
    
    // Calculate when the token will expire
    const expiresAt = new Date((decoded as any).exp * 1000);
    console.log(`Token expires at: ${expiresAt.toISOString()}`);
  }
  
  return token;
};

/**
 * Verify a JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload or throws error with context
 */
export const verifyToken = (token: string): any => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Verifying token. Preview: ${token.substring(0, 20)}...`);
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Token verified successfully');
      console.log('Decoded token:', decoded);
    }
    
    return decoded;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Use our AppError class for standardized error handling
    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Token expired', 'TOKEN_EXPIRED', error);
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw AppError.unauthorized('Invalid token', 'INVALID_TOKEN', error);
    } else {
      throw AppError.unauthorized('Token verification failed', 'VERIFICATION_FAILED', error as Error);
    }
  }
}; 