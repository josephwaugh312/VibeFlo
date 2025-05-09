import { generateToken, verifyToken } from '../../utils/jwt';
import jwt from 'jsonwebtoken';

// Mock the jwt library
jest.mock('jsonwebtoken');

describe('JWT Utilities', () => {
  const mockUser = {
    id: 123,
    email: 'test@example.com',
    name: 'Test User',
    username: 'testuser'
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a token with the correct payload', () => {
      // Setup the mock
      (jwt.sign as jest.Mock).mockReturnValue('fake-token');

      // Call the function
      const token = generateToken(mockUser);

      // Assertions
      expect(token).toBe('fake-token');
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          username: mockUser.username,
          role: 'user',
          is_admin: false
        }),
        expect.any(String), // JWT_SECRET
        expect.objectContaining({ expiresIn: expect.any(String) }) // JWT_EXPIRES_IN
      );
    });
  });

  describe('verifyToken', () => {
    it('should return the decoded token when token is valid', () => {
      // Setup the mock
      const decodedToken = { id: 123, email: 'test@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);

      // Call the function
      const result = verifyToken('valid-token');

      // Assertions
      expect(result).toEqual(decodedToken);
      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
    });

    it('should return null when token is invalid', () => {
      // Setup the mock to throw an error
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Call the function
      const result = verifyToken('invalid-token');

      // Assertions
      expect(result).toBeNull();
      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', expect.any(String));
    });
  });
}); 