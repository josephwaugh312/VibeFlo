import express from 'express';
import cors from 'cors';
import passport from 'passport';
import path from 'path';
import session from 'express-session';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { errorMiddleware } from './utils/errorHandler';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Import database connections - both the pg Pool and Knex instance are used in different parts of the app
import './config/db'; // This imports the pg Pool
import './db'; // This imports the Knex configuration

// Import passport configuration
import './config/passport';

// Initialize Express app
const app = express();

// Configure CORS with explicit settings
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const allowedOrigins = [
  'http://localhost:3000', 
  'http://192.168.1.212:3000',
  'https://vibeflo.onrender.com'
];

// Add CLIENT_URL to allowed origins if it's not already included
if (clientUrl && !allowedOrigins.includes(clientUrl)) {
  allowedOrigins.push(clientUrl);
}

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Increase JSON payload limit to 10MB to handle image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware - required for Passport OAuth flows
app.use(session({
  secret: process.env.SESSION_SECRET || 'vibeflo_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session()); // This line is necessary for persistent login sessions

// Mount API routes
app.use('/api', apiRoutes);

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  console.log('Running in production mode - configuring static file serving');
  
  // Possible build paths (from most likely to least likely)
  const possibleBuildPaths = [
    path.join(__dirname, '../dist/client/build'),           // Render deployment path
    path.join(__dirname, '../../client/build'),             // Standard path
    path.join(__dirname, '../../../client/build'),          // One level up
    path.join(__dirname, '../../../../client/build'),       // Two levels up
    '/opt/render/project/src/client/build',                 // Specific Render path
    path.join(process.cwd(), 'client/build'),               // Current working directory
    path.join(process.cwd(), 'dist/client/build')           // Fallback path
  ];
  
  // Find the first path that exists
  let buildPath = null;
  for (const p of possibleBuildPaths) {
    if (fs.existsSync(p)) {
      buildPath = p;
      console.log(`Found React build directory at: ${buildPath}`);
      break;
    }
  }
  
  if (buildPath) {
    // Log all paths being accessed for debugging
    app.use((req, res, next) => {
      console.log(`Request path: ${req.method} ${req.path}`);
      next();
    });
    
    // Serve static files from the found build folder
    app.use(express.static(buildPath));
    
    // API routes are already mounted at /api above
    
    // Explicitly handle the playlists route that was giving 404 errors
    app.get('/playlists', (req, res) => {
      console.log('Handling direct request to /playlists');
      const indexHtmlPath = path.join(buildPath, 'index.html');
      res.sendFile(indexHtmlPath);
    });
    
    // Handle React routing, return all requests to React app
    // This must come AFTER the API routes but BEFORE error middleware
    app.get('*', (req, res, next) => {
      // Skip API routes - they are already handled
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      console.log(`Serving React app for path: ${req.path}`);
      const indexHtmlPath = path.join(buildPath, 'index.html');
      
      // Check if the index.html file exists
      if (fs.existsSync(indexHtmlPath)) {
        console.log(`Sending index.html for client-side routing: ${req.path}`);
        return res.sendFile(indexHtmlPath);
      } else {
        console.error(`ERROR: index.html not found at ${indexHtmlPath}`);
        console.error(`Available files in ${buildPath}:`);
        try {
          const files = fs.readdirSync(buildPath);
          console.error(files.join(', '));
        } catch (err) {
          console.error(`Error reading directory: ${err.message}`);
        }
        return res.status(404).send('Client app not available - index.html not found');
      }
    });
  } else {
    console.warn('React build directory not found. Static file serving is disabled.');
    console.warn('Checked paths:');
    possibleBuildPaths.forEach(p => console.warn(`- ${p}`));
    
    // Add a fallback route for the root
    app.get('/', (req, res) => {
      res.send('VibeFlo API is running (Client not available)');
    });
  }
} else {
  // Root route for development
  app.get('/', (req, res) => {
    res.send('VibeFlo API is running');
  });
}

// Add API error handling middleware
app.use('/api/*', (err: any, req: any, res: any, next: any) => {
  console.error('API Error:', err);
  
  // Check for database relation errors
  if (err.code === '42P01') { // relation does not exist
    return res.status(500).json({
      error: 'Database schema error: Missing table',
      message: 'The application database schema needs to be updated. Please contact support.',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
  
  // Check for database column errors
  if (err.code === '42703') { // column does not exist
    return res.status(500).json({
      error: 'Database schema error: Missing column',
      message: 'The application database schema needs to be updated. Please contact support.',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
  
  // Forward to main error handler
  next(err);
});

// Error handling middleware should be last
app.use(errorMiddleware);

// Export the app for use in index.ts
export { app }; 