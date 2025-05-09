const { AppError } = require('../../utils/errors');
const { handleError } = require('../../utils/errorHandler.simple');

describe('Error Handler', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    
    // Spy on console.error to prevent test output pollution
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle auth errors with 401 status', () => {
    const error = AppError.unauthorized('Not authenticated');
    
    handleError(error, mockRequest, mockResponse, mockNext);
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Not authenticated'
    });
  });

  it('should handle validation errors with 400 status', () => {
    const error = AppError.badRequest('Invalid input');
    
    handleError(error, mockRequest, mockResponse, mockNext);
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Invalid input'
    });
  });

  it('should handle resource errors with 404 status', () => {
    const error = AppError.notFound('Resource not found');
    
    handleError(error, mockRequest, mockResponse, mockNext);
    
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Resource not found'
    });
  });

  it('should handle server errors with 500 status', () => {
    const error = AppError.internal('Internal server error');
    
    handleError(error, mockRequest, mockResponse, mockNext);
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Internal server error'
    });
  });

  it('should handle generic errors with 500 status', () => {
    const error = new Error('Generic error');
    
    handleError(error, mockRequest, mockResponse, mockNext);
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Generic error'
    });
  });

  it('should pass JWT errors to next middleware', () => {
    const error = new Error('JWT error');
    error.name = 'JsonWebTokenError';
    
    handleError(error, mockRequest, mockResponse, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith(error);
  });
}); 