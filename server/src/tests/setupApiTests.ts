/**
 * Jest setup file specifically for API integration tests
 * This provides enhanced mocking of database and authentication
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { setupMockQueryResponse } from './mocks/db-adapter.mock';

// Mock the database config
jest.mock('../config/db', () => {
  const { createMockPool } = require('./mocks/db-adapter.mock');
  return createMockPool();
});

// Mock the db module
jest.mock('../db', () => {
  const { createMockKnex } = require('./mocks/db-adapter.mock');
  return { db: createMockKnex() };
});

// Set JWT secret for testing
process.env.JWT_SECRET = 'test-secret-key';

// Create user object for testing
const testUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  username: 'testuser'
};

// Mock the JWT module
jest.mock('jsonwebtoken', () => {
  return {
    verify: jest.fn().mockImplementation((token, secret) => {
      // Just return a decoded payload without actual verification
      if (token) {
        try {
          const [header, payload] = token.split('.');
          return JSON.parse(Buffer.from(payload, 'base64').toString());
        } catch (e) {
          return { id: 1, email: 'test@example.com' };
        }
      }
      throw new Error('Invalid token');
    }),
    sign: jest.fn().mockImplementation((payload, secret, options) => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      return `${header}.${encodedPayload}.signature`;
    })
  };
});

// Mock crypto for deterministic testing
jest.mock('crypto', () => {
  return {
    randomBytes: jest.fn().mockImplementation((size) => ({
      toString: jest.fn().mockReturnValue('mock-token-string')
    })),
    createHash: jest.fn().mockImplementation((algorithm) => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('mock-hash-digest')
    }))
  };
});

// Mock passport-jwt Strategy without using this keyword
jest.mock('passport-jwt', () => {
  return {
    Strategy: jest.fn().mockImplementation((options, verify) => {
      // Store the verify callback for later use
      (global as any).__jwtVerifyCallback = verify;
      
      // Create a mock strategy with properly typed functions
      const strategyMock = {
        name: 'jwt',
        authenticate: jest.fn().mockImplementation((req: Request) => {
          const authHeader = req.headers.authorization;
          const failCallback = (strategyMock as any).fail;
          const successCallback = (strategyMock as any).success;
          const errorCallback = (strategyMock as any).error;
          
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            failCallback('No auth token');
            return;
          }
          
          const token = authHeader.split(' ')[1];
          
          try {
            // Decode token
            const payload = jwt.verify(token, process.env.JWT_SECRET as string);
            
            // Call the verify callback with the decoded token
            (global as any).__jwtVerifyCallback(payload, (err: Error | null, user: any) => {
              if (err) {
                errorCallback(err);
                return;
              }
              
              if (!user) {
                failCallback('User not found');
                return;
              }
              
              successCallback(user);
            });
          } catch (error) {
            failCallback('Invalid token');
          }
        })
      };
      
      // Add the passport methods
      (strategyMock as any).fail = jest.fn();
      (strategyMock as any).success = jest.fn();
      (strategyMock as any).error = jest.fn();
      
      return strategyMock;
    }),
    ExtractJwt: {
      fromAuthHeaderAsBearerToken: jest.fn().mockReturnValue(() => 'dummy_function')
    }
  };
});

// Mock passport
jest.mock('passport', () => {
  const passportMock = {
    use: jest.fn(),
    authenticate: jest.fn().mockImplementation((strategy, options, callback) => {
      return (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          if (callback) {
            return callback(null, false, { message: 'No auth token' });
          }
          return res.status(401).json({ message: 'Unauthorized - No valid token provided' });
        }
        
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
          
          // Create a user with the decoded token data
          const user = {
            id: (decoded as any).id || 1,
            email: (decoded as any).email || 'test@example.com',
            name: 'Test User',
            username: 'testuser'
          };
          
          // Set the user object on the request
          req.user = user;
          
          if (callback) {
            return callback(null, user);
          }
          
          return next();
        } catch (error) {
          if (callback) {
            return callback(error, false);
          }
          return res.status(401).json({ message: 'Unauthorized - Invalid token' });
        }
      };
    }),
    initialize: jest.fn().mockReturnValue((req: Request, res: Response, next: NextFunction) => {
      return next();
    }),
    serializeUser: jest.fn(),
    deserializeUser: jest.fn()
  };
  
  return passportMock;
});

// Mock the auth middleware
jest.mock('../middleware/auth.middleware', () => {
  return {
    protect: jest.fn().mockImplementation((req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized - No valid token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        // Use our mocked verify function
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
    }),
    isAdmin: jest.fn().mockImplementation((req, res, next) => {
      // Assume the user is an admin for tests
      next();
    }),
    optionalAuth: jest.fn().mockImplementation((req, res, next) => {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
          req.user = { 
            id: (decoded as any).id, 
            email: (decoded as any).email,
            name: 'Test User',
            username: 'testuser'
          };
        } catch (error) {
          // In optional auth, we don't fail on error
        }
      }
      next();
    })
  };
});

// Mock passport config setup
jest.mock('../config/passport', () => {
  return {
    __esModule: true,
    default: {
      use: jest.fn(),
      initialize: jest.fn(() => (req: Request, res: Response, next: NextFunction) => next()),
      authenticate: jest.fn().mockImplementation((strategy) => {
        return (req: Request, res: Response, next: NextFunction) => {
          const authHeader = req.headers.authorization;
          
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized - No valid token provided' });
          }
          
          try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
            
            // Set the user object on the request
            req.user = { 
              id: (decoded as any).id, 
              email: (decoded as any).email,
              name: 'Test User',
              username: 'testuser'
            };
            
            return next();
          } catch (error) {
            return res.status(401).json({ message: 'Unauthorized - Invalid token' });
          }
        };
      })
    }
  };
});

// Mock bcrypt
jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('mocksalt'),
  hash: jest.fn().mockResolvedValue('mockhash'),
  compare: jest.fn().mockImplementation((data, hash) => Promise.resolve(true))
}));

// Utility function to create a test JWT token
export const generateTestToken = (userId = 1, email = 'test@example.com') => {
  // Use our mocked sign function
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
  setupMockQueryResponse(mockPool, mockResponses);
};

beforeEach(() => {
  jest.clearAllMocks();
}); 