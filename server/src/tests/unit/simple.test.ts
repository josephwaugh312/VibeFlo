import { Request, Response, NextFunction } from 'express';

describe('Simple Test', () => {
  it('should verify basic testing functionality', () => {
    // Create a mock function
    const mockFn = jest.fn();
    
    // Call the mock function
    mockFn('test');
    
    // Verify it was called with the right arguments
    expect(mockFn).toHaveBeenCalledWith('test');
  });
  
  it('should verify async testing functionality', async () => {
    // Create a mock function that returns a promise
    const mockAsyncFn = jest.fn().mockResolvedValue('success');
    
    // Call the async function
    const result = await mockAsyncFn();
    
    // Verify the result
    expect(result).toBe('success');
    expect(mockAsyncFn).toHaveBeenCalled();
  });
  
  it('should verify Express mocking functionality', () => {
    // Create mock request and response objects
    const mockRequest = {} as Request;
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const mockNext = jest.fn() as NextFunction;
    
    // Define a simple controller function
    const simpleController = (req: Request, res: Response, next: NextFunction) => {
      res.status(200).json({ success: true });
    };
    
    // Call the controller
    simpleController(mockRequest, mockResponse, mockNext);
    
    // Verify response methods were called
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
    expect(mockNext).not.toHaveBeenCalled();
  });
}); 