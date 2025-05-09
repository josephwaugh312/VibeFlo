require('dotenv').config();
const axios = require('axios');

const PROD_URL = 'https://vibeflo-api.onrender.com';
const LOCAL_URL = 'http://localhost:5001';

// Use the production URL for testing
const baseURL = PROD_URL;

console.log('Testing auth register endpoint in production environment...');
console.log(`Base URL: ${baseURL}`);

// Generate a unique test user
const timestamp = Date.now();
const testUser = {
  name: `Test User ${timestamp}`,
  username: `testuser${timestamp}`,
  email: `testuser${timestamp}@example.com`,
  password: 'Test1234!'
};

async function testRegistration() {
  console.log(`\nTesting registration with user: ${testUser.username}`);
  
  try {
    // First, check headers for the register endpoint to see if it's set up correctly
    const headResponse = await axios.head(`${baseURL}/auth/register`);
    console.log('Register endpoint header check:');
    console.log(`Status: ${headResponse.status}`);
    console.log(`Content-Type: ${headResponse.headers['content-type'] || 'Not specified'}`);
    
    // Then attempt to register a test user
    console.log('\nAttempting to register test user...');
    const response = await axios.post(`${baseURL}/auth/register`, testUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    
    // Check if response is HTML or JSON
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('html')) {
      console.log('Warning: Received HTML response instead of JSON!');
      console.log('This indicates the route is still serving static files instead of API responses');
      
      // Only show a small part of the HTML to avoid cluttering the output
      const htmlPreview = response.data.substring(0, 100);
      console.log(`HTML Preview: ${htmlPreview}...`);
    } else {
      // Show the JSON response
      console.log('JSON Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Content-Type: ${error.response.headers['content-type'] || 'Not specified'}`);
      
      // Check if error response is HTML or JSON
      const contentType = error.response.headers['content-type'] || '';
      if (contentType.includes('html')) {
        console.log('Warning: Received HTML error response instead of JSON!');
        
        // Only show a small part of the HTML to avoid cluttering the output
        const htmlPreview = error.response.data.substring(0, 100);
        console.log(`HTML Preview: ${htmlPreview}...`);
      } else if (error.response.data) {
        console.log('Error Response:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }
}

testRegistration()
  .then(() => console.log('\nTesting complete!'))
  .catch(err => console.error('Testing failed:', err)); 