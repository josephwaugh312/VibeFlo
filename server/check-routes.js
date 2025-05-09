require('dotenv').config();
const { execSync } = require('child_process');

// Print current directory and files to help with debugging
console.log('Current directory:', process.cwd());
console.log('Server directory files:');
try {
  const files = execSync('ls -la').toString();
  console.log(files);
} catch (error) {
  console.error('Error listing files:', error.message);
}

console.log('\nChecking route configuration...');
console.log('=================================');

// Output information about the auth routes
console.log('\nAuth routes configured:');
console.log('- /auth/*: Direct auth routes mounted in app.ts');
console.log('- /api/auth/*: Auth routes mounted through apiRoutes in app.ts');

console.log('\nTo fix the client issue:');
console.log('1. Make sure auth API requests use the correct prefix (/auth/ instead of /api/auth/)');
console.log('2. The app.ts file should be modified to prioritize both /api/ and /auth/ routes over static files');
console.log('3. Rebuild and redeploy the server to Render');

// Show build information
console.log('\nBuild information:');
try {
  const buildInfo = {
    'NODE_ENV': process.env.NODE_ENV || 'development',
    'PORT': process.env.PORT || '5000',
    'Build Date': new Date().toISOString()
  };
  console.log(buildInfo);
} catch (error) {
  console.error('Error getting build information:', error.message);
}

console.log('\nCheck complete!'); 