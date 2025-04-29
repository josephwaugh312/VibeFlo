import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const disableSSL = process.env.DISABLE_SSL === 'true';

// Log database configuration
console.log(`Knex connection mode: ${isProduction ? 'Production' : 'Development'}${isProduction && !disableSSL ? ' (SSL enabled)' : ''}`);

// Log database connection details (masking sensitive parts)
const connectionUrl = process.env.DATABASE_URL || 'not set';
const maskedUrl = connectionUrl.replace(/\/\/([^:]+):([^@]+)@/, '//********:********@');
console.log(`Database URL being used: ${maskedUrl}`);

// Create a new PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction && !disableSSL ? { 
    rejectUnauthorized: false // Required for Render PostgreSQL
  } : undefined
});

// Debug connection information
console.log(`Database connection mode: ${isProduction ? 'Production' : 'Development'}${isProduction && !disableSSL ? ' (SSL enabled)' : ''}`);

// Connect to the database
export const connectDB = async () => {
  try {
    console.log('Attempting to connect to PostgreSQL database...');
    const client = await pool.connect();
    console.log('PostgreSQL database connected successfully');
    
    // Log SSL status
    const sslResult = await client.query('SHOW ssl');
    console.log(`Database SSL status: ${sslResult.rows[0].ssl}`);
    
    // Log server version
    const versionResult = await client.query('SELECT version()');
    console.log(`PostgreSQL version: ${versionResult.rows[0].version.split(',')[0]}`);
    
    // Check if we can query the database
    try {
      const testQuery = await client.query('SELECT NOW() as now');
      console.log(`Database query test: ${testQuery.rows[0].now}`);
    } catch (queryError) {
      console.error('Database test query failed:', queryError);
    }
    
    client.release();
    return true;
  } catch (error) {
    console.error('Error connecting to PostgreSQL database:', error);
    console.error('Connection details:', {
      ssl: pool.options.ssl ? 'enabled' : 'disabled',
      host: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : 'unknown',
      database: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).pathname.substring(1) : 'unknown'
    });
    
    if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. Check if the database server is running and accessible.');
      console.error(`Attempted connection to: ${error.address}:${error.port}`);
    } else if (error.code === 'ETIMEDOUT') {
      console.error('Connection timed out. Network issue or firewall problem.');
    } else if (error.code === 'ENOTFOUND') {
      console.error('Host not found. Check the hostname in your connection string.');
    }
    
    // Don't exit process here, let the caller handle it
    return false;
  }
};

// Export pool to be used in other files
export default pool; 