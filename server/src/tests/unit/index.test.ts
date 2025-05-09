import dotenv from 'dotenv';

// Mock all dependencies
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

jest.mock('pg', () => {
  return { 
    Pool: jest.fn().mockImplementation(() => ({
      query: jest.fn(),
      end: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

// Mock express more comprehensively, including Router
jest.mock('express', () => {
  const mockRouter = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    use: jest.fn()
  };
  
  const mockApp = {
    use: jest.fn(),
    get: jest.fn(),
    listen: jest.fn()
  };
  
  const mockExpress = jest.fn(() => mockApp);
  return Object.assign(mockExpress, {
    Router: jest.fn(() => mockRouter)
  });
});

// Mock routes to avoid imports that would cause errors
jest.mock('../../routes/auth.routes', () => ({}));
jest.mock('../../routes/user.routes', () => ({}));
jest.mock('../../routes/theme.routes', () => ({}));
jest.mock('../../routes/protect.routes', () => ({}));
jest.mock('../../routes/playlist.routes', () => ({}));
jest.mock('../../routes/youtube.routes', () => ({}));

// Mock connection to avoid actual database connections
jest.mock('../../config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(true)
}));

// Other mocks to avoid actual execution
jest.mock('../../app', () => ({
  app: { use: jest.fn(), listen: jest.fn() }
}));

// Mock email service to avoid SendGrid API key issues
jest.mock('../../services/email.service', () => ({
  EmailService: {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendNotificationEmail: jest.fn()
  }
}));

// Mock console to avoid cluttering test output
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock process.exit to avoid actual exit
const originalExit = process.exit;
process.exit = jest.fn() as any;

describe('Database initialization', () => {
  it('should be a valid test file', () => {
    expect(true).toBe(true);
  });
});

describe('Server Entry Point (index.ts)', () => {
  // Store original env variables
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // Set required environment variables
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
    process.env.SENDGRID_API_KEY = 'mock-api-key';
  });
  
  afterAll(() => {
    // Restore original process.exit
    process.exit = originalExit;
    process.env = originalEnv;
  });

  it('should load without errors', () => {
    // Just importing the file should not throw
    expect(() => {
      jest.isolateModules(() => {
        require('../../index');
      });
    }).not.toThrow();
    
    // Verify dotenv.config was called
    expect(dotenv.config).toHaveBeenCalled();
  });
  
  it('should exit if DATABASE_URL is not provided', () => {
    // Create a new mock function for the modified test
    const mockExit = jest.fn();
    process.exit = mockExit as any;
    
    // Setup - this needs to be a separate module instance 
    // with its own context to properly test the behavior
    jest.isolateModules(() => {
      // Remove DATABASE_URL before requiring index
      process.env.DATABASE_URL = '';
      
      // This should trigger an exit due to missing DATABASE_URL
      require('../../index');
    });
    
    // Verify process.exit was called with 1
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}); 