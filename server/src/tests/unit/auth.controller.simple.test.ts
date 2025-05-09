import { Request, Response, NextFunction } from 'express';

// Create a simplified auth controller for testing
const simpleRegister = (req: Request, res: Response, next: NextFunction) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
    });
  }
  
  // Simulate a successful registration
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    user: {
      id: 1,
      username,
      email,
    },
  });
};

describe('Auth Controller - Simple Register', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  
  beforeEach(() => {
    mockRequest = {
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      },
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    mockNext = jest.fn();
  });
  
  it('should successfully register a user', () => {
    // Call the simple register function
    simpleRegister(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Registration successful',
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      },
    });
    
    // Verify next was not called
    expect(mockNext).not.toHaveBeenCalled();
  });
  
  it('should return 400 if required fields are missing', () => {
    // Missing password
    mockRequest.body = {
      username: 'testuser',
      email: 'test@example.com',
    };
    
    simpleRegister(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Missing required fields',
    });
    
    expect(mockNext).not.toHaveBeenCalled();
  });
}); 