import { Pool } from 'pg';

// Create a mock for the database client
const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};

// Create a mock for the database pool
const mockPool = {
  connect: jest.fn().mockResolvedValue(mockClient)
};

// Setup the mock for pg
jest.mock('pg', () => {
  return {
    Pool: jest.fn(() => mockPool)
  };
});

// Mock dotenv to prevent actual environment loading
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Mock process.exit to prevent actual exit during tests
const originalExit = process.exit;
process.exit = jest.fn() as any;

// Mock console methods to capture output
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();
console.log = mockConsoleLog;
console.error = mockConsoleError;

describe('check-users Script', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });
  
  // Restore original methods after tests
  afterAll(() => {
    process.exit = originalExit;
    console.log = global.console.log;
    console.error = global.console.error;
  });

  it('should connect to database and query for users', async () => {
    // Mock the query response with sample user data
    mockClient.query.mockResolvedValueOnce({
      rows: [
        { id: 1, name: 'John Doe', username: 'johndoe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', username: 'janesmith', email: 'jane@example.com' }
      ],
      rowCount: 2
    });
    
    // Import and run the script
    require('../../scripts/check-users-test-fixes');
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    // Verify database connection was established
    expect(mockPool.connect).toHaveBeenCalled();
    
    // Verify the correct query was executed
    expect(mockClient.query).toHaveBeenCalledWith(
      'SELECT id, name, username, email FROM users'
    );
    
    // Verify all expected messages were logged in order
    expect(mockConsoleLog.mock.calls[0][0]).toBe('Checking existing users in the database...');
    expect(mockConsoleLog.mock.calls[1][0]).toBe('Found 2 users:');
    
    // Verify connection was released
    expect(mockClient.release).toHaveBeenCalled();
    
    // Verify process.exit was called with success code
    expect(process.exit).toHaveBeenCalledWith(0);
  });
  
  it('should handle case when no users are found', async () => {
    // Mock query response with empty result
    mockClient.query.mockResolvedValueOnce({
      rows: [],
      rowCount: 0
    });
    
    // Import and run the script
    require('../../scripts/check-users-test-fixes');
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    // Verify messages were logged in order
    expect(mockConsoleLog.mock.calls[0][0]).toBe('Checking existing users in the database...');
    expect(mockConsoleLog.mock.calls[1][0]).toBe('No users found in the database.');
    
    // Verify connection was still released
    expect(mockClient.release).toHaveBeenCalled();
    
    // Verify process.exit was called
    expect(process.exit).toHaveBeenCalledWith(0);
  });
  
  it('should handle database query errors', async () => {
    // Create a test error
    const testError = new Error('Database connection failed');
    
    // Mock query to throw an error
    mockClient.query.mockRejectedValueOnce(testError);
    
    // Import and run the script
    require('../../scripts/check-users-test-fixes');
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    // Verify initial message and error were logged
    expect(mockConsoleLog.mock.calls[0][0]).toBe('Checking existing users in the database...');
    expect(mockConsoleError.mock.calls[0][0]).toBe('Error checking users:');
    expect(mockConsoleError.mock.calls[0][1]).toBe(testError);
    
    // Verify connection was still released
    expect(mockClient.release).toHaveBeenCalled();
    
    // Verify process.exit was called with success code
    expect(process.exit).toHaveBeenCalledWith(0);
  });
}); 