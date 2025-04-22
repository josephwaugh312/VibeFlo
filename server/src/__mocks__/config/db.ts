import { createMockPool } from '../../tests/mocks/db-adapter.mock';

// Create and export a mock Pool
const mockPool = createMockPool();

// Export connectDB function
export const connectDB = jest.fn().mockImplementation(async () => {
  console.log('Mock database connected');
  return Promise.resolve();
});

// Export default for default import uses
export default mockPool; 