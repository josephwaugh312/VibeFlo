import { Request, Response, NextFunction } from 'express';
import { User } from '../../types';

// Define the AuthRequest interface directly to avoid import issues
interface AuthRequest extends Request {
  user?: User;
}

// Mocks for bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn()
}));

// Mock for database
jest.mock('../../config/db', () => ({
  __esModule: true, 
  default: {
    query: jest.fn(),
    connect: jest.fn()
  },
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

// Import after mocks are set up
import bcrypt from 'bcrypt';
import { deleteAccount } from '../../controllers/user.controller';
import pool from '../../config/db';

// Mock console to keep tests clean
console.error = jest.fn();
console.log = jest.fn();

describe('User Controller - deleteAccount', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      user: {
        id: 123,
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser'
      }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockNext = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
    pool.query = jest.fn();
    pool.connect = jest.fn();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;
    
    await deleteAccount(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'User not authenticated'
    });
  });

  it('should return 400 if password is not provided', async () => {
    mockRequest.body = {};
    
    await deleteAccount(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Please provide your password'
    });
  });

  it('should return 404 if user is not found', async () => {
    mockRequest.body = { password: 'password123' };
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
    
    await deleteAccount(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'User not found'
    });
  });

  it('should return 400 if password is incorrect', async () => {
    mockRequest.body = { password: 'wrongpassword' };
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 123, password: 'hashedPassword', username: 'testuser' }],
      rowCount: 1
    });
    
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
    
    await deleteAccount(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Password is incorrect'
    });
  });

  it('should successfully simulate account deletion in test mode', async () => {
    mockRequest.body = { password: 'correctpassword', testMode: true };
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 123, password: 'hashedPassword', username: 'testuser' }],
      rowCount: 1
    });
    
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    
    await deleteAccount(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', 'hashedPassword');
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'TEST MODE: Account deletion was simulated successfully. No actual deletion occurred.',
      testMode: true
    });
  });

  it('should successfully delete account', async () => {
    mockRequest.body = { password: 'correctpassword' };
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 123, password: 'hashedPassword', username: 'testuser' }],
      rowCount: 1
    });
    
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    
    // Mock successful transaction
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // verification_tokens check
        .mockResolvedValueOnce({}) // Delete verification_tokens
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // password_reset_tokens check
        .mockResolvedValueOnce({}) // Delete password_reset_tokens
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // failed_login_attempts check
        .mockResolvedValueOnce({}) // Delete failed_login_attempts
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // playlists check
        .mockResolvedValueOnce({}) // Delete playlists
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // pomodoro_sessions check
        .mockResolvedValueOnce({}) // Delete pomodoro_sessions
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // pomodoro_todos check
        .mockResolvedValueOnce({}) // Delete pomodoro_todos
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // user_settings check
        .mockResolvedValueOnce({}) // Delete user_settings
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // user_themes check
        .mockResolvedValueOnce({}) // Delete user_themes
        .mockResolvedValueOnce({}) // Delete user
        .mockResolvedValueOnce({}), // COMMIT
      release: jest.fn()
    };
    
    (pool.connect as jest.Mock).mockResolvedValueOnce(mockClient);
    
    await deleteAccount(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', 'hashedPassword');
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Account deleted successfully'
    });
  });

  it('should handle database errors during account deletion', async () => {
    mockRequest.body = { password: 'correctpassword' };
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 123, password: 'hashedPassword', username: 'testuser' }],
      rowCount: 1
    });
    
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    
    // Mock failed transaction
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error('Database error')) // First query fails
        .mockResolvedValueOnce({}), // ROLLBACK
      release: jest.fn()
    };
    
    (pool.connect as jest.Mock).mockResolvedValueOnce(mockClient);
    
    await deleteAccount(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Server error'
    });
  });
}); 