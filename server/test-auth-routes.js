require('dotenv').config();
const axios = require('axios');

const PROD_URL = 'https://vibeflo-api.onrender.com';
const LOCAL_URL = 'http://localhost:5001';

// Use the production URL for testing
const baseURL = PROD_URL;

console.log('Testing auth routes in production environment...');
console.log(`Base URL: ${baseURL}`);

// Test endpoints
const endpoints = [
  { method: 'GET', url: '/auth/status', name: 'Auth Status' },
  { method: 'GET', url: '/api/themes', name: 'Themes API' },
  { method: 'HEAD', url: '/auth/register', name: 'Register Endpoint Headers' }
];

async function testEndpoints() {
  for (const endpoint of endpoints) {
    console.log(`\nTesting ${endpoint.name}: ${endpoint.method} ${baseURL}${endpoint.url}`);
    
    try {
      let response;
      
      if (endpoint.method === 'GET') {
        response = await axios.get(`${baseURL}${endpoint.url}`);
      } else if (endpoint.method === 'HEAD') {
        response = await axios.head(`${baseURL}${endpoint.url}`);
      }
      
      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers['content-type']}`);
      
      if (endpoint.method === 'GET' && response.data) {
        // Only output the first part of the response to avoid large outputs
        const dataStr = JSON.stringify(response.data).substring(0, 200);
        console.log(`Response (truncated): ${dataStr}${dataStr.length >= 200 ? '...' : ''}`);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Content-Type: ${error.response.headers['content-type']}`);
      }
    }
  }
}

testEndpoints()
  .then(() => console.log('\nTesting complete!'))
  .catch(err => console.error('Testing failed:', err)); 