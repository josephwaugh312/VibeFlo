import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Create a new PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? {
    rejectUnauthorized: false // Required for Render PostgreSQL
  } : false
});

// Connect to the database
export const connectDB = async () => {
  try {
    await pool.connect();
    console.log('PostgreSQL database connected');
  } catch (error) {
    console.error('Error connecting to PostgreSQL database:', error);
    process.exit(1);
  }
};

// Export pool to be used in other files
export default pool; 