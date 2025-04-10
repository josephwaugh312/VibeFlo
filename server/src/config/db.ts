import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create a new PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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