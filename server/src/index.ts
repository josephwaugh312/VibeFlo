import dotenv from 'dotenv';
import { Pool } from 'pg';
import { app } from './app';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import themeRoutes from './routes/theme.routes';
import protectedRoutes from './routes/protect.routes';
import playlistRoutes from './routes/playlist.routes';
import youtubeRoutes from './routes/youtube.routes';

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

// Log database connection details (masking sensitive parts)
const maskedUrl = DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//********:********@');
console.log(`Index.ts using database URL: ${maskedUrl}`);
console.log(`Index.ts environment: ${process.env.NODE_ENV || 'development'}`);

// Global pool that can be used in your APIs - using the same SSL settings as in config/db.ts
const isProduction = process.env.NODE_ENV === 'production';
export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isProduction ? { 
    rejectUnauthorized: false 
  } : undefined
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/youtube', youtubeRoutes);

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