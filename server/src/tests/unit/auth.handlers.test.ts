import { Request, Response } from 'express';
import * as authController from '../../controllers/auth.controller';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../config/db';

// Mock the dependencies
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked-token'),
  verify: jest.fn()
}));

jest.mock('../../services/email.service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true)
}));

// Mock console.log and console.error
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('Auth Controller Handlers', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    // Reset mock function calls
    jest.clearAllMocks();
    
    // Setup request and response mocks
    mockRequest = {
      body: {},
      headers: {},
      params: {},
      cookies: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis()
    };
  });
  
  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Setup request body
      mockRequest.body = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };
      
      // Mock database responses
      // First check if user exists - return empty array
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });
      
      // Mock bcrypt hash
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password');
      
      // Mock user insertion - return the new user
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          is_verified: false
        }],
        rowCount: 1
      });
      
      // Call the register function
      await authController.register(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('Registration successful'),
        needsVerification: true,
        user: expect.objectContaining({
          email: 'test@example.com',
          username: 'testuser'
        })
      }));
    });
    
    it('should return 400 when email is already in use', async () => {
      // Setup request body
      mockRequest.body = {
        email: 'existing@example.com',
        username: 'newuser',
        password: 'password123'
      };
      
      // Mock database response for existing user check
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          email: 'existing@example.com',
          username: 'existinguser'
        }],
        rowCount: 1
      });
      
      // Call the register function
      await authController.register(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Email already in use'
      }));
    });
    
    it('should return 400 when username is already taken', async () => {
      // Setup request body
      mockRequest.body = {
        email: 'new@example.com',
        username: 'existinguser',
        password: 'password123'
      };
      
      // Mock database response for existing user check
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          email: 'different@example.com',
          username: 'existinguser'
        }],
        rowCount: 1
      });
      
      // Call the register function
      await authController.register(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Username already taken'
      }));
    });
    
    it('should return 400 when required fields are missing', async () => {
      // Setup request with missing fields
      mockRequest.body = {
        email: 'test@example.com'
        // Missing username and password
      };
      
      // Call the register function
      await authController.register(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('required')
      }));
    });
  });
  
  describe('login', () => {
    it('should login successfully with email', async () => {
      // Setup request body
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      // Setup env for JWT
      process.env.JWT_SECRET = 'test-secret';
      
      // Mock database response - user found
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed_password',
        is_verified: true
      };
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1
      });
      
      // Mock password comparison - success
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      
      // Mock JWT sign implementation
      (jwt.sign as jest.Mock).mockImplementation((payload, secret, options) => {
        return 'mocked-token';
      });
      
      // Call the login function
      await authController.login(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(jwt.sign).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Login successful',
        token: 'mocked-token'
      }));
    });
    
    it('should login successfully with username', async () => {
      // Setup request body with username instead of email
      mockRequest.body = {
        login: 'testuser', // Using login instead of email
        password: 'password123'
      };
      
      // Setup env for JWT
      process.env.JWT_SECRET = 'test-secret';
      
      // Mock database response - user found
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed_password',
        is_verified: true
      };
      
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1
      });
      
      // Mock password comparison - success
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      
      // Call the login function
      await authController.login(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(jwt.sign).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Login successful',
        token: 'mocked-token'
      }));
    });
    
    it('should return 401 for invalid credentials - wrong password', async () => {
      // Setup request body
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      // Mock database response - user found
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          password: 'hashed_password',
          is_verified: true
        }],
        rowCount: 1
      });
      
      // Mock password comparison - fail
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      
      // Call the login function
      await authController.login(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashed_password');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid credentials'
      }));
    });
    
    it('should return 401 for non-existent user', async () => {
      // Setup request body
      mockRequest.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };
      
      // Mock database response - user not found
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });
      
      // Call the login function
      await authController.login(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid credentials'
      }));
    });
    
    it('should return 400 when required fields are missing', async () => {
      // Setup request with missing fields
      mockRequest.body = {
        // Missing email/login and password
      };
      
      // Call the login function
      await authController.login(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('provide email/username and password')
      }));
    });
  });
}); 