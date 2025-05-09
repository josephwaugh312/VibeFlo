require('dotenv').config();
const axios = require('axios');

const PROD_URL = 'https://vibeflo-api.onrender.com';

console.log('Testing all possible auth endpoints in production...');
console.log(`Base URL: ${PROD_URL}`);

// Test various endpoint combinations
const endpoints = [
  { method: 'HEAD', url: '/auth/register', name: 'Direct Auth Register' },
  { method: 'HEAD', url: '/api/auth/register', name: 'API Auth Register' },
  { method: 'HEAD', url: '/auth/login', name: 'Direct Auth Login' },
  { method: 'HEAD', url: '/api/auth/login', name: 'API Auth Login' },
  { method: 'GET', url: '/api/themes', name: 'Themes API (Control)' }
];

async function testEndpoints() {
  console.log('\nTesting all endpoint combinations to find the correct one:');
  console.log('======================================================');
  
  let successfulEndpoints = [];
  
  for (const endpoint of endpoints) {
    console.log(`\nTesting ${endpoint.name}: ${endpoint.method} ${PROD_URL}${endpoint.url}`);
    
    try {
      let response;
      
      if (endpoint.method === 'GET') {
        response = await axios.get(`${PROD_URL}${endpoint.url}`);
      } else if (endpoint.method === 'HEAD') {
        response = await axios.head(`${PROD_URL}${endpoint.url}`);
      }
      
      console.log(`✅ SUCCESS - Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers['content-type']}`);
      
      successfulEndpoints.push({
        url: endpoint.url,
        name: endpoint.name,
        contentType: response.headers['content-type']
      });
      
    } catch (error) {
      console.log(`❌ FAILED - Error: ${error.message}`);
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Content-Type: ${error.response.headers['content-type'] || 'Not specified'}`);
      }
    }
  }
  
  // Summary
  console.log('\n======================================================');
  console.log('SUMMARY OF WORKING ENDPOINTS:');
  
  if (successfulEndpoints.length > 0) {
    successfulEndpoints.forEach(endpoint => {
      console.log(`✅ ${endpoint.name} (${endpoint.url}) - ${endpoint.contentType}`);
    });
    
    // Make a recommendation
    const authEndpoints = successfulEndpoints.filter(e => e.url.includes('/auth/'));
    if (authEndpoints.length > 0) {
      console.log('\nRECOMMENDATION:');
      console.log(`The client should use the following pattern for auth requests: ${authEndpoints[0].url.split('/')[1]}`);
    }
  } else {
    console.log('❌ No working auth endpoints found.');
  }
}

testEndpoints()
  .then(() => console.log('\nTesting complete!'))
  .catch(err => console.error('Testing failed:', err)); 