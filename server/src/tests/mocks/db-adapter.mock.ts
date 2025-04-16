import { Pool, QueryResult } from 'pg';

// Define mock types for better type safety
type MockQueryResult<T = any> = {
  rows: T[];
  rowCount: number;
};

// Interface for mock data store
interface MockDataStore {
  users: any[];
  themes: any[];
  verification_tokens: any[];
  [key: string]: any[];
}

// Create an in-memory mock database
class MockDatabaseAdapter {
  private static instance: MockDatabaseAdapter;
  private store: MockDataStore;

  private constructor() {
    // Initialize with empty tables
    this.store = {
      users: [],
      themes: [],
      verification_tokens: [],
      playlists: [],
      tracks: [],
      playlist_tracks: []
    };
  }

  // Singleton pattern
  public static getInstance(): MockDatabaseAdapter {
    if (!MockDatabaseAdapter.instance) {
      MockDatabaseAdapter.instance = new MockDatabaseAdapter();
    }
    return MockDatabaseAdapter.instance;
  }

  // Clear all data (useful between tests)
  public clearData(): void {
    Object.keys(this.store).forEach(key => {
      this.store[key] = [];
    });
  }

  // Seed data for testing
  public seedData(table: string, data: any[]): void {
    this.store[table] = [...data];
  }

  // Mock query method that matches pg's query signature
  public async query(text: string, params?: any[]): Promise<MockQueryResult> {
    // Parse the query to determine the operation
    const query = text.trim().toLowerCase();
    
    // Handle SELECT queries
    if (query.startsWith('select')) {
      return this.handleSelect(query, params);
    }
    
    // Handle INSERT queries
    if (query.startsWith('insert')) {
      return this.handleInsert(query, params);
    }
    
    // Handle UPDATE queries
    if (query.startsWith('update')) {
      return this.handleUpdate(query, params);
    }
    
    // Handle DELETE queries
    if (query.startsWith('delete')) {
      return this.handleDelete(query, params);
    }

    // Default empty result for unsupported queries
    return { rows: [], rowCount: 0 };
  }

  // Handle SELECT queries
  private handleSelect(query: string, params?: any[]): MockQueryResult {
    // This is a simplified implementation
    // In a real implementation, you would parse the query properly
    
    // Extract table name (very simplified approach)
    const tableMatch = query.match(/from\s+(\w+)/i);
    if (!tableMatch) {
      return { rows: [], rowCount: 0 };
    }
    
    const tableName = tableMatch[1];
    const tableData = this.store[tableName] || [];
    
    // If there's a WHERE clause with ID (simplified)
    if (params && params.length > 0 && query.includes('where') && query.includes('id')) {
      const id = params[0];
      const filtered = tableData.filter(item => item.id === id);
      return { rows: filtered, rowCount: filtered.length };
    }
    
    // Return all data from the table
    return { rows: [...tableData], rowCount: tableData.length };
  }

  // Handle INSERT queries
  private handleInsert(query: string, params?: any[]): MockQueryResult {
    // Very simplified approach - in reality, you would parse the SQL properly
    const tableMatch = query.match(/into\s+(\w+)/i);
    if (!tableMatch || !params || params.length === 0) {
      return { rows: [], rowCount: 0 };
    }
    
    const tableName = tableMatch[1];
    
    // Extract the RETURNING clause to determine what to return
    const returningMatch = query.match(/returning\s+(.*?)(?:$|\s+where)/i);
    const returningFields = returningMatch 
      ? returningMatch[1].split(',').map(f => f.trim()) 
      : ['id'];
    
    // Create a new record with auto-incremented ID
    const newId = (this.store[tableName].length > 0) 
      ? Math.max(...this.store[tableName].map(item => item.id)) + 1 
      : 1;
    
    // Simplified record creation - in reality, you'd parse the column names from the query
    const newRecord: Record<string, any> = { id: newId, ...this.extractInsertData(query, params) };
    
    this.store[tableName].push(newRecord);
    
    // Return the specified fields from the new record
    const result = returningFields.includes('*') 
      ? newRecord 
      : Object.fromEntries(
          returningFields.map(field => [field, newRecord[field]])
        );
        
    return { rows: [result], rowCount: 1 };
  }

  // Helper method to extract insert data
  private extractInsertData(query: string, params: any[]): object {
    // This is a very simplified approach - in reality, you'd parse the SQL query properly
    // Just creating some dummy data here based on params
    const record: Record<string, any> = {};
    
    // If we have column names in the query, use them
    const columnsMatch = query.match(/\(([^)]+)\)/);
    if (columnsMatch) {
      const columns = columnsMatch[1].split(',').map(col => col.trim());
      columns.forEach((col, index) => {
        if (index < params.length) {
          record[col] = params[index];
        }
      });
    } else {
      // Fallback - just assign params to common column names
      const commonColumns = ['name', 'email', 'username', 'password_hash', 'created_at', 'updated_at'];
      params.forEach((value, index) => {
        if (index < commonColumns.length) {
          record[commonColumns[index]] = value;
        }
      });
    }
    
    // Add timestamps if not present
    if (!record.created_at) {
      record.created_at = new Date().toISOString();
    }
    if (!record.updated_at) {
      record.updated_at = new Date().toISOString();
    }
    
    return record;
  }

  // Handle UPDATE queries
  private handleUpdate(query: string, params?: any[]): MockQueryResult {
    if (!params || params.length === 0) {
      return { rows: [], rowCount: 0 };
    }
    
    // Extract table name
    const tableMatch = query.match(/update\s+(\w+)/i);
    if (!tableMatch) {
      return { rows: [], rowCount: 0 };
    }
    
    const tableName = tableMatch[1];
    const tableData = this.store[tableName] || [];
    
    // Find the ID in the WHERE clause (simplified)
    const lastParam = params[params.length - 1];
    const id = typeof lastParam === 'number' ? lastParam : null;
    
    if (id === null) {
      return { rows: [], rowCount: 0 };
    }
    
    // Find and update the record
    const index = tableData.findIndex(item => item.id === id);
    if (index === -1) {
      return { rows: [], rowCount: 0 };
    }
    
    // Update the record (simplified approach)
    tableData[index] = { 
      ...tableData[index], 
      ...this.extractUpdateData(query, params),
      updated_at: new Date().toISOString()
    };
    
    // Extract the RETURNING clause
    const returningMatch = query.match(/returning\s+(.*?)(?:$|\s+where)/i);
    let result: Record<string, any> = {};
    
    if (returningMatch) {
      const returningFields = returningMatch[1].split(',').map(f => f.trim());
      result = returningFields.includes('*') 
        ? tableData[index] 
        : Object.fromEntries(
            returningFields.map(field => [field, tableData[index][field]])
          );
    } else {
      result = { id: tableData[index].id };
    }
    
    return { rows: [result], rowCount: 1 };
  }

  // Helper method to extract update data
  private extractUpdateData(query: string, params: any[]): object {
    // Simplified approach - in reality, you'd parse the SQL SET clause
    const record: Record<string, any> = {};
    
    // Try to match SET clauses
    const setMatch = query.match(/set\s+(.*?)(?:where|returning|$)/i);
    if (setMatch) {
      const setClauses = setMatch[1].split(',').map(clause => clause.trim());
      
      // Process each SET clause
      setClauses.forEach((clause, index) => {
        const parts = clause.split('=');
        if (parts.length === 2) {
          const column = parts[0].trim();
          if (column !== 'id' && index < params.length - 1) { // Last param is typically the ID in WHERE clause
            record[column] = params[index];
          }
        }
      });
    }
    
    return record;
  }

  // Handle DELETE queries
  private handleDelete(query: string, params?: any[]): MockQueryResult {
    if (!params || params.length === 0) {
      return { rows: [], rowCount: 0 };
    }
    
    // Extract table name
    const tableMatch = query.match(/from\s+(\w+)/i);
    if (!tableMatch) {
      return { rows: [], rowCount: 0 };
    }
    
    const tableName = tableMatch[1];
    const tableData = this.store[tableName] || [];
    
    // Find the ID in the WHERE clause (simplified)
    const id = params[0];
    
    // Find and remove the record
    const index = tableData.findIndex(item => item.id === id);
    if (index === -1) {
      return { rows: [], rowCount: 0 };
    }
    
    // Remove and store the deleted record
    const deletedRecord = tableData.splice(index, 1)[0];
    
    // Extract the RETURNING clause
    const returningMatch = query.match(/returning\s+(.*?)(?:$|\s+where)/i);
    let result: Record<string, any> = {};
    
    if (returningMatch) {
      const returningFields = returningMatch[1].split(',').map(f => f.trim());
      result = returningFields.includes('*') 
        ? deletedRecord 
        : Object.fromEntries(
            returningFields.map(field => [field, deletedRecord[field]])
          );
      return { rows: [result], rowCount: 1 };
    }
    
    return { rows: [], rowCount: 1 };
  }

  // Mock the connection method for transaction tests
  public async connect() {
    return {
      query: this.query.bind(this),
      release: jest.fn(),
    };
  }
}

// Create a mock Pool that uses our adapter
export const createMockPool = (): Pool => {
  const adapter = MockDatabaseAdapter.getInstance();
  
  return {
    query: jest.fn(adapter.query.bind(adapter)),
    connect: jest.fn(adapter.connect.bind(adapter)),
    end: jest.fn(),
    on: jest.fn(),
  } as unknown as Pool;
};

// Export the adapter for direct access to seed data
export const mockDatabaseAdapter = MockDatabaseAdapter.getInstance();

// Export helper functions
export const clearMockData = (): void => mockDatabaseAdapter.clearData();
export const seedMockData = (table: string, data: any[]): void => mockDatabaseAdapter.seedData(table, data); 