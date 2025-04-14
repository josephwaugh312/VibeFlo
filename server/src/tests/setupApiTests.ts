/**
 * Jest setup file specifically for API integration tests
 * This provides enhanced mocking of database and authentication
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';

// Mock the database pool
jest.mock('../config/db', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn().mockReturnValue({
      query: jest.fn(),
      release: jest.fn(),
      on: jest.fn()
    })
  };
  return mockPool;
});

// Mock the JWT secret
process.env.JWT_SECRET = 'test-secret-key';

// Mock the auth middleware
jest.mock('../middleware/auth.middleware', () => {
  return {
    protect: (req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized - No valid token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        req.user = { 
          id: (decoded as any).id, 
          email: (decoded as any).email,
          name: 'Test User',
          username: 'testuser'
        };
        next();
      } catch (error) {
        return res.status(401).json({ message: 'Unauthorized - Invalid token' });
      }
    }
  };
});

// Utility function to create a test JWT token
export const generateTestToken = (userId = 1, email = 'test@example.com') => {
  return jwt.sign(
    { id: userId, email },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  );
};

// Mock password hash for testing
export const createTestHash = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

// Create a utility to set up database mocks for specific test cases
export const setupDbMock = (mockPool: any, mockResponses: any) => {
  // Clear previous mock implementations
  mockPool.query.mockReset();
  
  // If mock responses is a function, use it directly
  if (typeof mockResponses === 'function') {
    mockPool.query.mockImplementation(mockResponses);
    return;
  }
  
  // Otherwise, set up query-specific responses
  let callCount = 0;
  mockPool.query.mockImplementation((query: string, params: any) => {
    // For transaction mocks
    if (query === 'BEGIN' || query === 'COMMIT' || query === 'ROLLBACK') {
      return Promise.resolve();
    }
    
    // Return the next mock response in sequence if array
    if (Array.isArray(mockResponses)) {
      const response = mockResponses[callCount] || { rows: [], rowCount: 0 };
      callCount++;
      return Promise.resolve(response);
    }
    
    // Handle custom SQL pattern matching if responses is an object
    if (typeof mockResponses === 'object') {
      for (const pattern in mockResponses) {
        if (query.includes(pattern)) {
          const response = mockResponses[pattern];
          return Promise.resolve(response);
        }
      }
    }
    
    // Default response
    return Promise.resolve({ rows: [], rowCount: 0 });
  });
};

beforeEach(() => {
  jest.clearAllMocks();
}); 