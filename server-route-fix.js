/**
 * Fix for Render deployment API routing issues
 * This file should be included in your Render deployment
 */

const fs = require('fs');
const path = require('path');

// Find app.ts file to modify
const possiblePaths = [
  path.join(__dirname, 'src/app.ts'),
  path.join(__dirname, 'server/src/app.ts'),
  path.join(__dirname, '../server/src/app.ts')
];

let appPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    appPath = p;
    console.log(`Found app.ts at: ${appPath}`);
    break;
  }
}

if (!appPath) {
  console.error('Could not find app.ts file to modify');
  process.exit(1);
}

// Read the app.ts file
let appContent = fs.readFileSync(appPath, 'utf8');

// Fix the production middleware section
const newMiddlewareSection = `
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
      console.log(\`Found React build directory at: \${buildPath}\`);
      break;
    }
  }
  
  if (buildPath) {
    // CRITICAL FIX: API and Auth middleware must be processed BEFORE any static file handling
    // Static files middleware only applies to non-API/auth routes
    app.use((req, res, next) => {
      // Log all requests for debugging
      console.log(\`REQUEST: \${req.method} \${req.path}\`);
      
      // If this is an API or auth request, just continue to the next middleware
      if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
        return next();
      }
      
      // For all other paths, serve static files
      express.static(buildPath)(req, res, next);
    });
    
    // Handle React routing for any non-API/auth routes that don't match static files
    app.use((req, res, next) => {
      // Skip API and auth routes and static file requests
      if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.includes('.')) {
        return next();
      }
      
      console.log(\`Serving React app for path: \${req.path}\`);
      const indexHtmlPath = path.join(buildPath, 'index.html');
      
      if (fs.existsSync(indexHtmlPath)) {
        return res.sendFile(indexHtmlPath);
      } else {
        console.error(\`ERROR: index.html not found at \${indexHtmlPath}\`);
        return res.status(404).send('Client app not available - index.html not found');
      }
    });
  } else {
    console.warn('React build directory not found. Static file serving is disabled.');
    console.warn('Checked paths:');
    possibleBuildPaths.forEach(p => console.warn(\`- \${p}\`));
    
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
}`;

// Replace the entire middleware section with our fixed version
// We need to find the start and end of the middleware section
const middlewareSectionStart = 'if (process.env.NODE_ENV === \'production\') {';
const middlewareSectionEnd = '} else {\n  // Root route for development';

// Find the start index
const startIndex = appContent.indexOf(middlewareSectionStart);
if (startIndex === -1) {
  console.error('Could not find start of middleware section');
  process.exit(1);
}

// Find the end index
const endIndex = appContent.indexOf(middlewareSectionEnd, startIndex);
if (endIndex === -1) {
  console.error('Could not find end of middleware section');
  process.exit(1);
}

// Replace the section
const newAppContent = 
  appContent.substring(0, startIndex) + 
  newMiddlewareSection + 
  appContent.substring(endIndex);

// Write the new content back to the file
fs.writeFileSync(appPath, newAppContent);

console.log('Successfully fixed the middleware section in app.ts'); 