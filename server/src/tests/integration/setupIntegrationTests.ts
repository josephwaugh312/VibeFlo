/**
 * Setup for integration tests
 * This file provides utilities for mocking database connections and authentication
 * for integration tests to avoid actual network connections.
 */

import { Request, Response, NextFunction } from 'express';
import { mockPool } from '../mocks/db-mock';

/**
 * Configure all required mocks for integration tests
 */
export function setupIntegrationTestMocks() {
  // Mock database before any imports that use it
  jest.mock('../../config/db', () => mockPool);
  
  // Mock passport
  jest.mock('passport', () => {
    return {
      use: jest.fn(),
      authenticate: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => {
        // Test for authenticated user - if no Authorization header, reject
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
        
        // Attach a user object to the request
        req.user = { 
          id: 1, 
          email: 'test@example.com',
          name: 'Test User',
          username: 'testuser'
        };
        return next();
      }),
      initialize: jest.fn().mockReturnValue((req: Request, res: Response, next: NextFunction) => next()),
      session: jest.fn().mockReturnValue((req: Request, res: Response, next: NextFunction) => next()),
      serializeUser: jest.fn(),
      deserializeUser: jest.fn()
    };
  });
  
  // Mock JWT utils
  jest.mock('../../utils/jwt', () => ({
    verifyToken: jest.fn(() => ({ id: 1, username: 'testuser' })),
    generateToken: jest.fn(() => 'mocked_token')
  }));
  
  // Mock bcrypt - passwordless authentication in tests
  jest.mock('bcrypt', () => ({
    genSalt: jest.fn().mockResolvedValue('mocksalt'),
    hash: jest.fn().mockResolvedValue('mockhash'),
    compare: jest.fn().mockResolvedValue(true)  // Always authenticate
  }));
  
  // Mock email service
  jest.mock('../../services/email.service', () => {
    const mockVerificationEmail = jest.fn().mockResolvedValue(true);
    const mockPasswordResetEmail = jest.fn().mockResolvedValue(true);
    const mockNotificationEmail = jest.fn().mockResolvedValue(true);
    
    return {
      default: {
        sendVerificationEmail: mockVerificationEmail,
        sendPasswordResetEmail: mockPasswordResetEmail,
        sendNotificationEmail: mockNotificationEmail,
      },
      // Export these as named exports matching the real service
      sendVerificationEmail: mockVerificationEmail,
      sendPasswordResetEmail: mockPasswordResetEmail,
      sendNotificationEmail: mockNotificationEmail,
    };
  });
  
  // Set JWT environment variable for testing
  process.env.JWT_SECRET = 'test_secret_key_for_testing_only';
}

/**
 * Generate a mock JWT token for testing authenticated routes
 */
export function generateTestToken(userId = 1, email = 'test@example.com') {
  return 'mock-jwt-token-for-testing-only';
}

/**
 * Setup database mock responses for a sequence of queries
 * @param poolResponses Responses for direct pool queries
 * @param clientResponses Responses for client queries (transactions)
 */
export function setupDbMockResponses(poolResponses: any[] = [], clientResponses: any[] = []) {
  mockPool.setQueryResponses(poolResponses);
  mockPool.setClientResponses(clientResponses);
} 