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
  error?: Error;
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
        const response = queryResponses[responseIndex++];
        if (response.error) {
          return Promise.reject(response.error);
        }
        return Promise.resolve(response);
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
  
  // Store a custom mock client for transaction tests
  mockClient: MockClient | null;
  
  constructor() {
    this.query = jest.fn();
    this.connect = jest.fn();
    this.end = jest.fn();
    this.on = jest.fn();
    
    this.queryResponses = [];
    this.clientResponses = [];
    this.mockClient = null;
    
    // Default query implementation
    this.query.mockImplementation((query: string, params?: any[]) => {
      console.log(`[MockPool] Query: ${query.substring(0, 50)}...`);
      
      if (this.queryResponses.length > 0) {
        const response = this.queryResponses.shift();
        if (response && response.error) {
          return Promise.reject(response.error);
        }
        return Promise.resolve(response);
      }
      
      return Promise.resolve({ rows: [], rowCount: 0 });
    });
    
    // Default connect implementation
    this.connect.mockImplementation(() => {
      console.log('[MockPool] Connect called');
      if (this.mockClient) {
        return Promise.resolve(this.mockClient);
      }
      const client = new MockClient(this.clientResponses);
      return Promise.resolve(client);
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
    this.mockClient = null;
  }
  
  // Setup responses for direct pool queries
  setQueryResponses(responses: MockQueryResponse[]) {
    this.queryResponses = [...responses];
  }
  
  // Setup responses for client queries (transactions)
  setClientResponses(responses: MockQueryResponse[]) {
    this.clientResponses = [...responses];
  }
  
  // Set a custom mock client for transaction tests
  setClientMock(mockClient: MockClient) {
    this.mockClient = mockClient;
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