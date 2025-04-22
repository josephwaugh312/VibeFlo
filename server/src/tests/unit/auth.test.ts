// Mock bcrypt
jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('mockedSalt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mockedToken')
}));

// Mock the database
jest.mock('../../db', () => {
  // Create a mock function for first() that can be mocked with different return values
  const mockFirst = jest.fn().mockResolvedValue(null);
  
  // Create a mock DB instance with Jest functions
  const mockDB = {
    where: jest.fn().mockReturnThis(),
    first: jest.fn(() => mockFirst()),
    insert: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([1]),
    select: jest.fn().mockReturnThis()
  };
  
  // Return the db function that will return our mock
  return { db: jest.fn(() => mockDB) };
});

// Import services and mocked modules
import { register, login } from '../../services/auth.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../db';

describe('Auth Service', () => {
  // Get reference to our mock db instance
  const mockDb = db() as any;
  
  // Set up JWT secret for tests
  process.env.JWT_SECRET = 'test_secret';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for first() to return null (no existing user)
    mockDb.first.mockImplementation(() => Promise.resolve(null));
  });
  
  describe('User Registration', () => {
    it('should hash password before storing in database', async () => {
      // Test user data
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };
      
      // Call register function
      await register(userData);
      
      // Check if genSalt was called
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      
      // Check if hash was called with the password and salt
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 'mockedSalt');
      
      // Check if user was inserted with hashed password
      expect(db).toHaveBeenCalledWith('users');
      expect(mockDb.insert).toHaveBeenCalledWith({
        name: userData.name,
        email: userData.email,
        username: userData.username,
        password: 'hashedPassword'
      });
    });
    
    it('should throw an error if email already exists', async () => {
      // Mock existing user
      mockDb.first.mockImplementationOnce(() => Promise.resolve({ email: 'test@example.com' }));
      
      // Test user data
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };
      
      // Expect registration to throw an error
      await expect(register(userData)).rejects.toThrow('Email already exists');
      
      // Verify database was queried
      expect(db).toHaveBeenCalledWith('users');
      expect(mockDb.where).toHaveBeenCalledWith({ email: userData.email });
      
      // Ensure insert was not called
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });
  
  describe('User Login', () => {
    it('should return a JWT token on successful login', async () => {
      // Test login data
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      // Mock database to return a user
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedPassword',
        bio: 'test bio',
        avatar_url: 'avatar.jpg',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockDb.first.mockImplementationOnce(() => Promise.resolve(mockUser));
      
      // Call login function
      const result = await login(loginData);
      
      // Check if password was compared
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
      
      // Check if JWT token was signed
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id },
        'test_secret',
        { expiresIn: '7d' }
      );
      
      // Check if the result contains the expected token and user data
      expect(result).toEqual({
        token: 'mockedToken',
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          username: mockUser.username,
          bio: mockUser.bio,
          avatar_url: mockUser.avatar_url,
          created_at: mockUser.created_at,
          updated_at: mockUser.updated_at
        }
      });
    });
    
    it('should throw an error if user not found', async () => {
      // Test login data
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };
      
      // Mock user not found
      mockDb.first.mockImplementationOnce(() => Promise.resolve(null));
      
      // Expect login to throw an error
      await expect(login(loginData)).rejects.toThrow('Invalid credentials');
      
      // Verify database was queried
      expect(db).toHaveBeenCalledWith('users');
      expect(mockDb.where).toHaveBeenCalledWith({ email: loginData.email });
      
      // Ensure compare was not called
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
    
    it('should throw an error if password is invalid', async () => {
      // Test login data
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      // Mock user found
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedPassword'
      };
      
      mockDb.first.mockImplementationOnce(() => Promise.resolve(mockUser));
      
      // Mock password comparison to fail
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      
      // Expect login to throw an error
      await expect(login(loginData)).rejects.toThrow('Invalid credentials');
      
      // Verify database was queried and password was compared
      expect(db).toHaveBeenCalledWith('users');
      expect(mockDb.where).toHaveBeenCalledWith({ email: loginData.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
      
      // Ensure JWT was not signed
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });
}); 