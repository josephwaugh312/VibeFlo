// A simplified mock for use in tests

export const mockDb = {
  // Mock the table name function that returns the query builder
  users: jest.fn().mockReturnThis(),
  themes: jest.fn().mockReturnThis(),
  user_settings: jest.fn().mockReturnThis(),
  
  // Mock query builder methods
  where: jest.fn().mockReturnThis(),
  join: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  first: jest.fn(),
  update: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  returning: jest.fn()
}; 