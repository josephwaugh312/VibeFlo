import { createUser, getUserByEmail, getUserById, getUserByUsername } from '../../models/User';
import pool from '../../config/db';

// Mock the database pool
jest.mock('../../config/db', () => {
  return {
    query: jest.fn()
  };
});

// Mock console.error to prevent test output noise
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('User Model', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      // Mock data
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      };

      // Mock database response
      const mockResult = {
        rows: [{
          id: 1,
          ...userData,
          created_at: new Date()
        }],
        rowCount: 1
      };

      // Setup mock for pool.query
      (pool.query as jest.Mock).mockResolvedValueOnce(mockResult);

      // Execute the function
      const result = await createUser(userData);

      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
        ['testuser', 'test@example.com', 'hashed_password']
      );

      // Verify result
      expect(result).toEqual(mockResult.rows[0]);
    });

    it('should throw error when database query fails', async () => {
      // Mock data
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      };

      // Setup mock for pool.query to throw error
      const dbError = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Execute and verify function throws error
      await expect(createUser(userData)).rejects.toThrow('Database error');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when found by email', async () => {
      // Mock data
      const email = 'test@example.com';
      const mockUser = {
        id: 1,
        username: 'testuser',
        email,
        password_hash: 'hashed_password',
        created_at: new Date()
      };

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1
      });

      // Execute the function
      const result = await getUserByEmail(email);

      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      // Verify result
      expect(result).toEqual(mockUser);
    });

    it('should return undefined when user not found by email', async () => {
      // Mock data
      const email = 'nonexistent@example.com';

      // Mock database response with empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Execute the function
      const result = await getUserByEmail(email);

      // Verify database was queried
      expect(pool.query).toHaveBeenCalledTimes(1);

      // Verify result is undefined
      expect(result).toBeUndefined();
    });

    it('should throw error when database query fails', async () => {
      // Setup mock for pool.query to throw error
      const dbError = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Execute and verify function throws error
      await expect(getUserByEmail('test@example.com')).rejects.toThrow('Database error');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserById', () => {
    it('should return user when found by id', async () => {
      // Mock data
      const userId = 1;
      const mockUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        created_at: new Date()
      };

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1
      });

      // Execute the function
      const result = await getUserById(userId);

      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      // Verify result
      expect(result).toEqual(mockUser);
    });

    it('should return undefined when user not found by id', async () => {
      // Mock data
      const userId = 999;

      // Mock database response with empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Execute the function
      const result = await getUserById(userId);

      // Verify database was queried
      expect(pool.query).toHaveBeenCalledTimes(1);

      // Verify result is undefined
      expect(result).toBeUndefined();
    });

    it('should throw error when database query fails', async () => {
      // Setup mock for pool.query to throw error
      const dbError = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Execute and verify function throws error
      await expect(getUserById(1)).rejects.toThrow('Database error');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserByUsername', () => {
    it('should return user when found by username', async () => {
      // Mock data
      const username = 'testuser';
      const mockUser = {
        id: 1,
        username,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        created_at: new Date()
      };

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1
      });

      // Execute the function
      const result = await getUserByUsername(username);

      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );

      // Verify result
      expect(result).toEqual(mockUser);
    });

    it('should return undefined when user not found by username', async () => {
      // Mock data
      const username = 'nonexistent';

      // Mock database response with empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Execute the function
      const result = await getUserByUsername(username);

      // Verify database was queried
      expect(pool.query).toHaveBeenCalledTimes(1);

      // Verify result is undefined
      expect(result).toBeUndefined();
    });

    it('should throw error when database query fails', async () => {
      // Setup mock for pool.query to throw error
      const dbError = new Error('Database error');
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Execute and verify function throws error
      await expect(getUserByUsername('testuser')).rejects.toThrow('Database error');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });
}); 