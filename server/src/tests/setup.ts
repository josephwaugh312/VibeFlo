/**
 * Jest setup file to configure test environment
 */

// Store original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

// Only suppress console output if not in debug mode
if (process.env.DEBUG !== 'true') {
  // Replace console methods with no-op functions
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
}

// Import test setup dependencies
import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';
import testPool, { connectTestDB, closeTestDB } from '../config/testDb';
import { initTestDatabase } from './init-test-db';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Set test timeout
jest.setTimeout(30000);

// Global mocks
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockImplementation(() => Promise.resolve({ messageId: 'test-message-id' })),
  }),
}));

// Set up test database before running tests
beforeAll(async () => {
  // Connect to test database
  const connected = await connectTestDB();
  if (!connected) {
    console.error('Failed to connect to test database. Tests may fail.');
  } else {
    try {
      // Initialize test database with required tables and test data
      await initTestDatabase(testPool);
    } catch (error) {
      console.error('Failed to initialize test database:', error);
    }
  }
});

// Clean up resources after all tests are complete
afterAll(async () => {
  // Restore original console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.info = originalConsoleInfo;

  // Close database connections
  await closeTestDB();
});

// Global mocks and setup
global.console = {
  ...console,
  // Uncomment to silence specific console methods during tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
};