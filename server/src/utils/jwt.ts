import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../types';
import { AppError } from './errors';

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