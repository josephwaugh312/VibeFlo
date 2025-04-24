import dotenv from 'dotenv';
import { Pool } from 'pg';
import { app } from './app';
import { connectDB } from './config/db';

// Load environment variables
dotenv.config();

// Environment variables
const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL;

// Validate required environment variables
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

// Global pool that can be used in your APIs
export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false
});

// Connect to database and start server
async function startServer() {
  try {
    // Connect to PostgreSQL using the config
    const dbConnected = await connectDB();
    
    if (!dbConnected) {
      console.error('Failed to connect to the database');
      process.exit(1);
    }

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API URL: http://localhost:${PORT}/api`);
      
      if (process.env.NODE_ENV === 'production') {
        console.log('Running in production mode');
      } else {
        console.log('Running in development mode');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  try {
    await pool.end();
    console.log('Pool has ended');
    process.exit(0);
  } catch (err) {
    console.error('Error during disconnection', err);
    process.exit(1);
  }
});

// Start the server
startServer(); 