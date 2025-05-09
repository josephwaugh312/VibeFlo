/**
 * Unified database mock adapter for integration tests
 * 
 * This provides a consistent way to mock the PostgreSQL database
 * for integration tests without requiring actual database connections.
 */

// Create a type for query responses
type MockQueryResponse = {
  rows: any[];
  rowCount: number;
};

// Mock client for transactions
class MockClient {
  query: jest.Mock;
  release: jest.Mock;
  
  constructor(queryResponses: MockQueryResponse[] = []) {
    this.query = jest.fn();
    this.release = jest.fn();
    
    let responseIndex = 0;
    
    // Setup the query implementation
    this.query.mockImplementation((query: string, params?: any[]) => {
      console.log(`[MockClient] Query: ${query.substring(0, 50)}...`);
      
      // Handle transaction statements automatically
      if (query === 'BEGIN') {
        return Promise.resolve();
      } else if (query === 'COMMIT') {
        return Promise.resolve();
      } else if (query === 'ROLLBACK') {
        return Promise.resolve();
      }
      
      // Return the next response if available, or empty result
      if (responseIndex < queryResponses.length) {
        return Promise.resolve(queryResponses[responseIndex++]);
      }
      
      // Default empty response
      return Promise.resolve({ rows: [], rowCount: 0 });
    });
  }
}

// Create a mock pool
class MockPool {
  query: jest.Mock;
  connect: jest.Mock;
  end: jest.Mock;
  on: jest.Mock;
  
  // Track query responses and client responses separately
  queryResponses: MockQueryResponse[];
  clientResponses: MockQueryResponse[];
  
  constructor() {
    this.query = jest.fn();
    this.connect = jest.fn();
    this.end = jest.fn();
    this.on = jest.fn();
    
    this.queryResponses = [];
    this.clientResponses = [];
    
    // Default query implementation
    this.query.mockImplementation((query: string, params?: any[]) => {
      console.log(`[MockPool] Query: ${query.substring(0, 50)}...`);
      
      if (this.queryResponses.length > 0) {
        return Promise.resolve(this.queryResponses.shift());
      }
      
      return Promise.resolve({ rows: [], rowCount: 0 });
    });
    
    // Default connect implementation
    this.connect.mockImplementation(() => {
      console.log('[MockPool] Connect called');
      return Promise.resolve(new MockClient(this.clientResponses));
    });
  }
  
  // Clear all mock data
  reset() {
    this.query.mockClear();
    this.connect.mockClear();
    this.end.mockClear();
    this.on.mockClear();
    
    this.queryResponses = [];
    this.clientResponses = [];
  }
  
  // Setup responses for direct pool queries
  setQueryResponses(responses: MockQueryResponse[]) {
    this.queryResponses = [...responses];
  }
  
  // Setup responses for client queries (transactions)
  setClientResponses(responses: MockQueryResponse[]) {
    this.clientResponses = [...responses];
  }
}

// Create and export a singleton instance
const mockPool = new MockPool();

// Function to create a mock for db.ts
export function createMockDbPool() {
  // Reset the mock for fresh state
  mockPool.reset();
  
  return mockPool;
}

// Export the mockPool directly for tests that need to configure it
export { mockPool };

// Export a helper to setup responses
export function setupMockResponses(poolResponses: MockQueryResponse[], clientResponses: MockQueryResponse[] = []) {
  mockPool.setQueryResponses(poolResponses);
  mockPool.setClientResponses(clientResponses);
} 