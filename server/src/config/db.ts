import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Create a new PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { 
    rejectUnauthorized: false // Required for Render PostgreSQL
  } : undefined
});

// Debug connection information
console.log(`Database connection mode: ${isProduction ? 'Production (SSL enabled)' : 'Development'}`);

// Connect to the database
export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL database connected successfully');
    
    // Log SSL status
    const sslResult = await client.query('SHOW ssl');
    console.log(`Database SSL status: ${sslResult.rows[0].ssl}`);
    
    client.release();
  } catch (error) {
    console.error('Error connecting to PostgreSQL database:', error);
    console.error('Connection details:', {
      ssl: pool.options.ssl ? 'enabled' : 'disabled',
      host: new URL(process.env.DATABASE_URL || '').hostname,
      database: new URL(process.env.DATABASE_URL || '').pathname.substring(1)
    });
    process.exit(1);
  }
};

// Export pool to be used in other files
export default pool; 