import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../types';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_jwt_secret';
const JWT_EXPIRES_IN = '7d'; // Token expiration time

/**
 * Generate a JWT token for a user
 * @param {User} user - User object from database
 * @returns {String} JWT token
 */
export const generateToken = (user: User): string => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify a JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload or throws error with context
 */
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    // Create a more informative error
    const authError: any = new Error(
      error instanceof jwt.TokenExpiredError
        ? 'Token expired'
        : error instanceof jwt.JsonWebTokenError
        ? 'Invalid token'
        : 'Token verification failed'
    );
    
    // Add specific error type information
    authError.statusCode = 401;
    authError.code = error instanceof jwt.TokenExpiredError
      ? 'TOKEN_EXPIRED'
      : error instanceof jwt.JsonWebTokenError
      ? 'INVALID_TOKEN'
      : 'VERIFICATION_FAILED';
    
    // Preserve original error for debugging
    authError.originalError = error;
    
    throw authError;
  }
}; 