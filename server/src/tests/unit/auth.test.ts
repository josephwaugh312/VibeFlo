import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock database modules
jest.mock('../../db', () => ({
  db: {
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    returning: jest.fn()
  }
}));

import { db } from '../../db';

// Import the auth service (or controllers if your logic is there)
import * as authService from '../../services/auth.service';

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    it('should hash password before storing in database', async () => {
      // Mock implementation
      const mockDb = db as any;
      mockDb.where.mockReturnThis();
      mockDb.first.mockResolvedValueOnce(null); // No existing email
      mockDb.insert.mockReturnThis();
      mockDb.returning.mockResolvedValueOnce([1]); // User created

      // Test data
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser'
      };

      // Call the function
      await authService.register(userData);

      // Check that the password was hashed
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
      
      // Check the insert function was called with hashed password
      const insertCall = mockDb.insert.mock.calls[0][0];
      
      // The insert should not contain the original password
      expect(insertCall).not.toContain('password123');
      
      // The password should be hashed
      expect(insertCall.password).not.toBe('password123');
      
      // We can't check the exact hash, but we can check it's a bcrypt hash
      expect(insertCall.password.startsWith('$2')).toBe(true);
    });

    // Add more tests for registration...
  });

  describe('User Login', () => {
    it('should return a JWT token on successful login', async () => {
      // Mock the password hash
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Mock implementation
      const mockDb = db as any;
      mockDb.where.mockReturnThis();
      mockDb.first.mockResolvedValueOnce({ 
        id: 1, 
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        username: 'testuser' 
      });

      // Test data
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Call the function
      const result = await authService.login(loginData);

      // Verify the token
      expect(result.token).toBeDefined();
      
      // Decode the token and check its contents
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET || 'test_secret_key_for_testing_only') as any;
      expect(decoded.userId).toBe(1);
    });

    // Add more tests for login...
  });

  // Add more test suites...
}); 