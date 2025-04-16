// globalTeardown.ts - Runs once after all tests
export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  // Close any open connections (database, etc)
  
  // If you created a test database, you might want to:
  // 1. Close all connections to the test database
  // 2. Optionally drop the test database if it was created just for tests
} 