// OAuth Debugging Tool
// Run this on your server to check callback configurations

const https = require('https');
const url = require('url');
const dotenv = require('dotenv');

dotenv.config();

// Get environment variables
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  GITHUB_CALLBACK_URL,
  CLIENT_URL
} = process.env;

console.log('=== OAuth Configuration Diagnostic ===');
console.log('\nChecking environment variables:');
console.log(`CLIENT_URL: ${CLIENT_URL || 'Not set'}`);
console.log(`GOOGLE_CALLBACK_URL: ${GOOGLE_CALLBACK_URL || 'Not set'}`);
console.log(`GITHUB_CALLBACK_URL: ${GITHUB_CALLBACK_URL || 'Not set'}`);

// Calculate the absolute callback URLs
const googleCallback = GOOGLE_CALLBACK_URL?.startsWith('http') 
  ? GOOGLE_CALLBACK_URL 
  : `${process.env.SERVER_URL || 'https://vibeflo-api.onrender.com'}${GOOGLE_CALLBACK_URL || '/api/auth/google/callback'}`;

const githubCallback = GITHUB_CALLBACK_URL?.startsWith('http')
  ? GITHUB_CALLBACK_URL
  : `${process.env.SERVER_URL || 'https://vibeflo-api.onrender.com'}${GITHUB_CALLBACK_URL || '/api/auth/github/callback'}`;

console.log('\nEffective callback URLs (what your server will use):');
console.log(`Google: ${googleCallback}`);
console.log(`GitHub: ${githubCallback}`);

console.log('\nVERIFICATION STEPS:');
console.log('1. Make sure the above URLs EXACTLY match what you have in your OAuth provider settings');
console.log('2. Google Cloud Console: APIs & Services > Credentials > OAuth 2.0 Client IDs');
console.log('3. GitHub: Settings > Developer settings > OAuth Apps');

console.log('\nTROUBLESHOOTING:');
console.log('1. If they don\'t match, update your OAuth provider settings to exactly match these URLs');
console.log('2. Ensure your server environment variables are correctly set in Render');
console.log('3. After updating, clear your browser cache and cookies');

console.log('\nLOGIN BUTTON URLs:');
console.log('These should be direct links to your API server:');
console.log(`Google login button should link to: https://vibeflo-api.onrender.com/api/auth/google`);
console.log(`GitHub login button should link to: https://vibeflo-api.onrender.com/api/auth/github`); 