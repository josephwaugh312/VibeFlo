/**
 * Mock Database Adapter
 * 
 * This file provides a comprehensive mock database adapter that can be used to:
 * 1. Mock Node-Postgres Pool interface used in config/db.ts
 * 2. Mock Knex query builder interface used in db.ts
 */

import { jest } from '@jest/globals';

// In-memory database store for advanced mocking
const dbStore: Record<string, any[]> = {};

// Mock Pool Interface (for config/db.ts)
export const createMockPool = () => {
  const mockPool = {
    query: jest.fn().mockImplementation(function() {
      return Promise.resolve({
        rows: [],
        rowCount: 0
      });
    }),
    connect: jest.fn().mockReturnValue({
      query: jest.fn(),
      release: jest.fn(),
      on: jest.fn()
    }),
    on: jest.fn(),
    end: jest.fn().mockImplementation(() => Promise.resolve())
  };
  return mockPool;
};

// Mock Knex Interface (for db.ts)
export const createMockKnex = () => {
  // Create chainable query builder
  const queryBuilder: any = {
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    rightJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    first: jest.fn().mockImplementation(function() { return Promise.resolve(null); }),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    returning: jest.fn().mockImplementation(function() { return Promise.resolve([]); }),
    orderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
    whereNotIn: jest.fn().mockReturnThis(),
    whereNull: jest.fn().mockReturnThis(),
    whereNotNull: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    countDistinct: jest.fn().mockReturnThis(),
    min: jest.fn().mockReturnThis(),
    max: jest.fn().mockReturnThis(),
    sum: jest.fn().mockReturnThis(),
    avg: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation(function() { return Promise.resolve([]); }),
    catch: jest.fn().mockImplementation(() => Promise.resolve([])),
    finally: jest.fn().mockImplementation(() => Promise.resolve([])),
    toSQL: jest.fn().mockReturnValue({ sql: 'mock sql', bindings: [] }),
    toString: jest.fn().mockReturnValue('mock sql')
  };
  
  // Mock transaction
  const transaction = jest.fn().mockImplementation(function() {
    const trx = {
      commit: jest.fn(),
      rollback: jest.fn(),
      ...queryBuilder
    };
    return Promise.resolve(trx);
  });
  
  // Main knex function
  const mockKnex: any = jest.fn().mockImplementation(function() {
    return queryBuilder;
  });
  
  // Add transaction method to main object
  mockKnex.transaction = transaction;
  
  // Add raw method
  mockKnex.raw = jest.fn().mockImplementation(() => Promise.resolve({ rows: [] }));
  
  return mockKnex;
};

// Utility to seed in-memory database
export const seedMockData = (tableName: string, data: any[]) => {
  dbStore[tableName] = [...data];
};

// Utility to clear in-memory database
export const clearMockData = () => {
  Object.keys(dbStore).forEach(key => {
    dbStore[key] = [];
  });
};

// Utility to configure a mock query response
export const setupMockQueryResponse = (mockPool: any, responses: any) => {
  // Create a new implementation directly without calling mockReset
  
  // If responses is a function, use it directly
  if (typeof responses === 'function') {
    mockPool.query = jest.fn().mockImplementation(responses);
    return;
  }
  
  // Set up sequential responses if it's an array
  if (Array.isArray(responses)) {
    let callCount = 0;
    mockPool.query = jest.fn().mockImplementation(function() {
      const query = arguments[0];
      if (query === 'BEGIN' || query === 'COMMIT' || query === 'ROLLBACK') {
        return Promise.resolve({ rows: [], rowCount: 0 });
      }
      
      const response = responses[callCount] || { rows: [], rowCount: 0 };
      callCount++;
      return Promise.resolve(response);
    });
    return;
  }
  
  // Handle pattern matching if it's an object
  mockPool.query = jest.fn().mockImplementation(function() {
    const query = arguments[0];
    if (query === 'BEGIN' || query === 'COMMIT' || query === 'ROLLBACK') {
      return Promise.resolve({ rows: [], rowCount: 0 });
    }
    
    for (const pattern in responses) {
      if (query.includes(pattern)) {
        const response = responses[pattern];
        // If the response is a function, call it with query and params
        if (typeof response === 'function') {
          return Promise.resolve(response(query, arguments[1]));
        }
        return Promise.resolve(response);
      }
    }
    
    return Promise.resolve({ rows: [], rowCount: 0 });
  });
};

const mockDb = {
  where: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  del: jest.fn().mockReturnThis(),
  first: jest.fn().mockReturnThis(),
  then: jest.fn().mockImplementation(function() { return Promise.resolve([]); }),
  transaction: jest.fn().mockImplementation(function() { return Promise.resolve({}); }),
};

export default mockDb; 