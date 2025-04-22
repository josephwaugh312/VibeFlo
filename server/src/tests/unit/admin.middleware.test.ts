import { Request, Response } from 'express';
import { isAdmin } from '../../middleware/admin.middleware';
import pool from '../../config/db';

// Mock database pool
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

describe('Admin Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;
  
  beforeEach(() => {
    mockRequest = {
      user: { id: 1, name: 'Test User', username: 'testuser', email: 'test@example.com' }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should continue if user is an admin', async () => {
    // Mock database response for admin user
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ is_admin: true }],
      rowCount: 1
    });

    await isAdmin(mockRequest as any, mockResponse as Response, nextFunction);
    
    expect(pool.query).toHaveBeenCalledWith('SELECT is_admin FROM users WHERE id = $1', [1]);
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should return 403 if user is not an admin', async () => {
    // Mock database response for non-admin user
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ is_admin: false }],
      rowCount: 1
    });

    await isAdmin(mockRequest as any, mockResponse as Response, nextFunction);
    
    expect(pool.query).toHaveBeenCalledWith('SELECT is_admin FROM users WHERE id = $1', [1]);
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      message: 'Access denied. Admin privileges required.' 
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if user is not authenticated', async () => {
    // Create request without user
    mockRequest.user = undefined;

    await isAdmin(mockRequest as any, mockResponse as Response, nextFunction);
    
    expect(pool.query).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 404 if user is not found', async () => {
    // Mock empty database response
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [],
      rowCount: 0
    });

    await isAdmin(mockRequest as any, mockResponse as Response, nextFunction);
    
    expect(pool.query).toHaveBeenCalledWith('SELECT is_admin FROM users WHERE id = $1', [1]);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 500 if database query fails', async () => {
    // Mock database error
    const error = new Error('Database error');
    (pool.query as jest.Mock).mockRejectedValue(error);

    await isAdmin(mockRequest as any, mockResponse as Response, nextFunction);
    
    expect(pool.query).toHaveBeenCalledWith('SELECT is_admin FROM users WHERE id = $1', [1]);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      message: 'Server error checking admin privileges' 
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
}); 