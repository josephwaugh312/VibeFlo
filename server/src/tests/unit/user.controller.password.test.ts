import { Request, Response } from 'express';
import { User } from '../../types';

// Define the AuthRequest interface directly to avoid import issues
interface AuthRequest extends Request {
  user?: User;
}

// Set up mocks before imports
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  genSalt: jest.fn(),
  hash: jest.fn()
}));

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
import { changePassword } from '../../controllers/user.controller';
import pool from '../../config/db';
import bcrypt from 'bcrypt';

// Mock console to keep tests clean
console.error = jest.fn();
console.log = jest.fn();

describe('User Controller - changePassword', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    (pool.query as jest.Mock).mockReset();
    (bcrypt.compare as jest.Mock).mockReset();
    (bcrypt.genSalt as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockReset();
    
    // Set up request and response mocks
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
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;
    
    await changePassword(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'User not authenticated'
    });
  });

  it('should return 400 if required fields are missing', async () => {
    mockRequest.body = {};
    
    await changePassword(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Please provide current password and new password'
    });
    
    // Test with only current password
    mockRequest.body = { currentPassword: 'oldPassword' };
    
    await changePassword(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    
    // Test with only new password
    mockRequest.body = { newPassword: 'newPassword123' };
    
    await changePassword(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
  });

  it('should return 404 if user is not found in database', async () => {
    mockRequest.body = {
      currentPassword: 'oldPassword',
      newPassword: 'newPassword123'
    };
    
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [],
      rowCount: 0
    });
    
    await changePassword(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [123]);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'User not found'
    });
  });

  it('should return 400 if current password is incorrect', async () => {
    mockRequest.body = {
      currentPassword: 'wrongPassword',
      newPassword: 'newPassword123'
    };
    
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 123, password: 'hashedPassword' }],
      rowCount: 1
    });
    
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
    
    await changePassword(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword');
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Current password is incorrect'
    });
  });

  it('should return 400 if new password is less than 8 characters', async () => {
    mockRequest.body = {
      currentPassword: 'correctPassword',
      newPassword: 'short'
    };
    
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 123, password: 'hashedPassword' }],
      rowCount: 1
    });
    
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    
    await changePassword(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Password must be at least 8 characters long'
    });
  });

  it('should return 400 if new password does not meet strength requirements', async () => {
    // Test with no uppercase
    mockRequest.body = {
      currentPassword: 'correctPassword',
      newPassword: 'password123'
    };
    
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 123, password: 'hashedPassword' }],
      rowCount: 1
    });
    
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    
    await changePassword(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Password must include at least one uppercase letter, one lowercase letter, and one number'
    });
    
    // Test with no lowercase
    mockRequest.body = {
      currentPassword: 'correctPassword',
      newPassword: 'PASSWORD123'
    };
    
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 123, password: 'hashedPassword' }],
      rowCount: 1
    });
    
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    
    await changePassword(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    
    // Test with no number
    mockRequest.body = {
      currentPassword: 'correctPassword',
      newPassword: 'PasswordNoNumbers'
    };
    
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 123, password: 'hashedPassword' }],
      rowCount: 1
    });
    
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    
    await changePassword(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
  });

  it('should successfully change password when all conditions are met', async () => {
    mockRequest.body = {
      currentPassword: 'correctPassword',
      newPassword: 'NewPassword123'
    };
    
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [{ id: 123, password: 'hashedPassword' }],
        rowCount: 1
      })
      .mockResolvedValueOnce({ rowCount: 1 }); // Update query result
    
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    (bcrypt.genSalt as jest.Mock).mockResolvedValueOnce('salt');
    (bcrypt.hash as jest.Mock).mockResolvedValueOnce('newHashedPassword');
    
    await changePassword(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', 'hashedPassword');
    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123', 'salt');
    
    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['newHashedPassword', 123]
    );
    
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Password updated successfully'
    });
  });

  it('should handle database errors during user lookup', async () => {
    mockRequest.body = {
      currentPassword: 'correctPassword',
      newPassword: 'NewPassword123'
    };
    
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
    
    await changePassword(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Server error'
    });
  });

  it('should handle database errors during password update', async () => {
    mockRequest.body = {
      currentPassword: 'correctPassword',
      newPassword: 'NewPassword123'
    };
    
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [{ id: 123, password: 'hashedPassword' }],
        rowCount: 1
      })
      .mockRejectedValueOnce(new Error('Database error')); // Update query fails
    
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    (bcrypt.genSalt as jest.Mock).mockResolvedValueOnce('salt');
    (bcrypt.hash as jest.Mock).mockResolvedValueOnce('newHashedPassword');
    
    await changePassword(
      mockRequest as AuthRequest,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Server error'
    });
  });
}); 