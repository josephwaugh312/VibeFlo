import { Request, Response } from 'express';
import { register } from '../../controllers/auth.controller';
import bcrypt from 'bcrypt';
import pool from '../../config/db';
import crypto from 'crypto';
import { sendVerificationEmail } from '../../services/email.service';
import { generateToken } from '../../utils/jwt';

// Mock the database pool
jest.mock('../../config/db', () => {
  return {
    query: jest.fn()
  };
});

// Mock bcrypt
jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('mockedSalt'),
  hash: jest.fn().mockResolvedValue('hashedPassword')
}));

// Mock JWT utils
jest.mock('../../utils/jwt', () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token')
}));

// Mock email service
jest.mock('../../services/email.service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true)
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mock-verification-token')
  })
}));

describe('register Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock response with spy functions
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Default mock request with valid registration data
    mockRequest = {
      body: {
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123'
      }
    };
    
    // Mock console.error to prevent noise in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  it('should register a user successfully', async () => {
    // Mock database to return no existing user
    (pool.query as jest.Mock).mockImplementation((query: string) => {
      // Check for email or username
      if (query.includes('SELECT * FROM users WHERE email') || 
          query.includes('SELECT * FROM users WHERE username')) {
        return { rows: [], rowCount: 0 };
      }
      
      // Creating user
      if (query.includes('INSERT INTO users')) {
        return { 
          rows: [{ 
            id: 1, 
            name: 'Test User',
            username: 'testuser',
            email: 'test@example.com',
            profile_picture: null,
            is_verified: false
          }],
          rowCount: 1 
        };
      }
      
      // Default case
      return { rows: [], rowCount: 0 };
    });
    
    // Call the controller
    await register(mockRequest as Request, mockResponse as Response);
    
    // Verify response status and body
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      user: expect.objectContaining({
        id: 1,
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com'
      }),
      token: 'mock-jwt-token',
      message: expect.stringContaining('Registration successful')
    }));
    
    // Verify bcrypt was called
    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 'mockedSalt');
    
    // Verify token generation
    expect(generateToken).toHaveBeenCalled();
    
    // Verify email was sent
    expect(sendVerificationEmail).toHaveBeenCalledWith('test@example.com', expect.any(String));
  });
  
  it('should return 400 if email already exists', async () => {
    // Mock database to return existing user with same email
    (pool.query as jest.Mock).mockImplementation((query: string) => {
      if (query.includes('SELECT * FROM users WHERE email')) {
        return { rows: [{ id: 1, email: 'test@example.com' }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    });
    
    // Call the controller
    await register(mockRequest as Request, mockResponse as Response);
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User with this email already exists' });
    
    // Verify no user was inserted
    expect(pool.query).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO users'), expect.anything());
  });
  
  it('should return 400 if username already exists', async () => {
    // Mock database to return existing user with same username
    (pool.query as jest.Mock).mockImplementation((query: string) => {
      if (query.includes('SELECT * FROM users WHERE email')) {
        return { rows: [], rowCount: 0 };
      }
      if (query.includes('SELECT * FROM users WHERE username')) {
        return { rows: [{ id: 1, username: 'testuser' }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    });
    
    // Call the controller
    await register(mockRequest as Request, mockResponse as Response);
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Username is already taken' });
    
    // Verify no user was inserted
    expect(pool.query).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO users'), expect.anything());
  });
  
  it('should return 400 if password is too short', async () => {
    // Setup request with short password
    mockRequest = {
      body: {
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'short'
      }
    };
    
    // Call the controller
    await register(mockRequest as Request, mockResponse as Response);
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Password must be at least 8 characters long' });
  });
  
  it('should return 400 if password lacks required characters', async () => {
    // Setup request with password missing uppercase letters
    mockRequest = {
      body: {
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'  // Missing uppercase
      }
    };
    
    // Call the controller
    await register(mockRequest as Request, mockResponse as Response);
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      message: 'Password must include at least one uppercase letter, one lowercase letter, and one number' 
    });
  });
  
  it('should return 400 if required fields are missing', async () => {
    // Setup request with missing fields
    mockRequest = {
      body: {
        name: 'Test User',
        // username: missing
        email: 'test@example.com',
        password: 'Password123'
      }
    };
    
    // Call the controller
    await register(mockRequest as Request, mockResponse as Response);
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      message: 'Please provide name, username, email, and password' 
    });
  });
  
  it('should return 500 if database error occurs', async () => {
    // Mock database to throw an error
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
    
    // Call the controller
    await register(mockRequest as Request, mockResponse as Response);
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Server error during registration' });
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalled();
  });
}); 