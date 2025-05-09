/**
 * Test script to verify the server routing fix works
 * This simulates the production environment locally
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = 5050;

// Mock API data
const mockPlaylists = [
  { id: 1, name: 'Test Playlist 1', tracks: [] },
  { id: 2, name: 'Test Playlist 2', tracks: [] }
];

const mockSettings = {
  pomodoro_duration: 25,
  short_break_duration: 5,
  long_break_duration: 15,
  pomodoros_until_long_break: 4,
  auto_start_breaks: true,
  auto_start_pomodoros: false,
  dark_mode: false
};

// Mount API routes
app.get('/api/playlists', (req, res) => {
  console.log('API ROUTE: GET /api/playlists');
  res.json(mockPlaylists);
});

app.get('/api/settings', (req, res) => {
  console.log('API ROUTE: GET /api/settings');
  res.json(mockSettings);
});

// Force production mode
process.env.NODE_ENV = 'production';

// Find client build path
const buildPath = path.join(__dirname, '../client/build');
if (!fs.existsSync(buildPath)) {
  console.error(`Client build directory not found at: ${buildPath}`);
  console.error('Please run "npm run build" in the client directory first');
  process.exit(1);
}

// Handle non-API routes with static file middleware 
// This implements the fix to ensure API routes take priority
app.use((req, res, next) => {
  // Log all requests for debugging
  console.log(`REQUEST: ${req.method} ${req.path}`);
  
  // If this is an API request, let it pass through to API routes
  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
    return next();
  }
  
  // For non-API paths, serve static files
  express.static(buildPath)(req, res, next);
});

// Handle React routing - serve index.html for any route that doesn't match
app.use((req, res, next) => {
  // Skip API routes and static file requests
  if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.includes('.')) {
    return next();
  }
  
  console.log(`Serving React app for path: ${req.path}`);
  const indexPath = path.join(buildPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  } else {
    return res.status(404).send('Client app not available - index.html not found');
  }
});

// Test the exact route that was causing issues
app.get('/playlists', (req, res, next) => {
  console.log('WARNING: Request to /playlists without /api prefix');
  
  // Let it pass through to test if our routing fix works
  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running in PRODUCTION mode on port ${PORT}`);
  console.log(`- Test normal React route: http://localhost:${PORT}`);
  console.log(`- Test API endpoint (should return JSON): http://localhost:${PORT}/api/playlists`);
  console.log(`- Test problematic route (should serve React): http://localhost:${PORT}/playlists`);
  console.log('Press Ctrl+C to exit');
}); 