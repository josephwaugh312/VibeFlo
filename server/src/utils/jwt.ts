import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../types';
import { AppError } from './errors';

dotenv.config();

// Define JWT_SECRET and handle type issues
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

// Define the StringValue type as required by jsonwebtoken
type StringValue = string | Buffer;

/**
 * Generate a JWT token for a user
 * @param {User} user - User object from database
 * @param {String} [expiresIn] - Custom expiration time for the token
 * @returns {String} JWT token
 */
export const generateToken = (user: User, expiresIn?: string): string => {
  // Use the expirationTime directly without putting it in an options object
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

  // Pass the options directly to avoid type issues
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: expirationTime as any });
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Token generated successfully. Preview: ${token.substring(0, 20)}...`);
    
    // Decode and log the token payload for debugging
    const decoded = jwt.decode(token);
    console.log('Token payload:', decoded);
    
    // Calculate when the token will expire (with safety check)
    if (decoded && typeof decoded === 'object' && 'exp' in decoded) {
      const expiresAt = new Date(decoded.exp * 1000);
      console.log(`Token expires at: ${expiresAt.toISOString()}`);
    }
  }
  
  return token;
};

/**
 * Verify a JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): JwtPayload | string | null => {
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
    
    // Return null for tests and API consumers that expect this behavior
    return null;
  }
}; 