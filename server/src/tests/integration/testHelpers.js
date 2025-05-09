/**
 * Test helpers for integration tests
 */

const mockPassport = () => {
  jest.mock('passport', () => {
    const original = jest.requireActual('passport');
    return {
      ...original,
      session: jest.fn().mockReturnValue((req, res, next) => next()),
      authenticate: jest.fn().mockImplementation(() => (req, res, next) => {
        // Mock authentication behavior
        if (req.headers.authorization === 'Bearer valid_token') {
          req.user = { id: 1, username: 'testuser' };
        }
        next();
      })
    };
  });
};

const mockSession = () => {
  jest.mock('express-session', () => {
    return jest.fn().mockImplementation((options) => {
      return (req, res, next) => {
        req.session = { 
          id: 'test-session-id',
          save: (callback) => callback && callback() 
        };
        next();
      };
    });
  });
};

/**
 * Sets up common mocks for integration tests
 */
const setupIntegrationTestMocks = () => {
  // Mock console methods to reduce noise
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  
  // Mock database
  jest.mock('../../config/db', () => ({
    pool: {
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 })
    }
  }));
  
  // Mock Knex database
  jest.mock('../../db', () => ({
    db: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([])
    })
  }));
  
  // Mock session and passport
  mockSession();
  mockPassport();
};

module.exports = {
  setupIntegrationTestMocks,
  mockPassport,
  mockSession
}; 