import { createMockKnex } from '../tests/mocks/db-adapter.mock';

// Create and export a mock Knex instance
export const db = createMockKnex();

// Export default for default import uses
export default db;

// Create mock functions for Knex query builder
const mockKnex = jest.fn(() => {
  return mockDb;
});

// Create all chainable methods
const mockDb = {
  where: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  join: jest.fn().mockReturnThis(),
  first: jest.fn(),
  update: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  del: jest.fn().mockReturnThis(),
  returning: jest.fn(),
};

// Export individual mock methods for direct testing
export const where = mockDb.where;
export const select = mockDb.select;
export const join = mockDb.join;
export const first = mockDb.first;
export const update = mockDb.update;
export const insert = mockDb.insert;
export const del = mockDb.del;
export const returning = mockDb.returning; 