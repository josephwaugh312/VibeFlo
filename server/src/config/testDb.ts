import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Set up test database connection pool
const testPool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Use shorter timeouts for tests
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
  // Limit pool size for tests
  max: 5,
});

// Connect to the test database and set up test data
export const connectTestDB = async () => {
  try {
    const client = await testPool.connect();
    console.log('Test database connected 🧪');
    client.release();
    return true;
  } catch (error) {
    console.error('Error connecting to test database:', error);
    return false;
  }
};

// Close all test database connections
export const closeTestDB = async () => {
  try {
    await testPool.end();
    console.log('Test database connections closed');
    return true;
  } catch (error) {
    console.error('Error closing test database connections:', error);
    return false;
  }
};

export default testPool; 