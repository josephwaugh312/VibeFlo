require('dotenv').config();
const axios = require('axios');

const PROD_URL = 'https://vibeflo-api.onrender.com';

console.log('Testing registration with POST request in production...');
console.log(`Base URL: ${PROD_URL}`);

// Generate a unique test user
const timestamp = Date.now();
const testUser = {
  name: `Test User ${timestamp}`,
  username: `testuser${timestamp}`,
  email: `testuser${timestamp}@example.com`,
  password: 'Test1234!'
};

async function testEndpoints() {
  console.log('\nTesting both registration endpoints with POST:');
  console.log('======================================================');
  
  // Test both possible endpoints
  const endpoints = [
    { url: '/auth/register', name: 'Direct Auth Register' },
    { url: '/api/auth/register', name: 'API Auth Register' }
  ];
  
  let successfulEndpoint = null;
  
  for (const endpoint of endpoints) {
    console.log(`\nTesting ${endpoint.name}: POST ${PROD_URL}${endpoint.url}`);
    
    try {
      const response = await axios.post(`${PROD_URL}${endpoint.url}`, testUser, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ SUCCESS - Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers['content-type']}`);
      
      // Check if response is HTML or JSON
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('html')) {
        console.log('Warning: Received HTML response instead of JSON!');
        console.log('HTML preview:', response.data.substring(0, 100));
      } else {
        console.log('Response data preview:', JSON.stringify(response.data).substring(0, 200));
        successfulEndpoint = endpoint;
      }
      
    } catch (error) {
      console.log(`❌ FAILED - Error: ${error.message}`);
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Content-Type: ${error.response.headers['content-type'] || 'Not specified'}`);
        
        // Check if error response is HTML or JSON
        const contentType = error.response.headers['content-type'] || '';
        if (contentType.includes('html')) {
          console.log('Warning: Received HTML error response!');
          console.log('HTML preview:', error.response.data.substring(0, 100));
        } else if (error.response.data) {
          console.log('Error data:', JSON.stringify(error.response.data).substring(0, 200));
        }
      }
    }
  }
  
  // Summary
  console.log('\n======================================================');
  console.log('SUMMARY:');
  
  if (successfulEndpoint) {
    console.log(`✅ Registration works with: ${successfulEndpoint.name} (${successfulEndpoint.url})`);
    console.log('\nRECOMMENDATION:');
    console.log(`The client should use ${successfulEndpoint.url} for registration`);
  } else {
    console.log('❌ Registration is not working with any tested endpoint.');
    console.log('The client changes may still be deploying, or additional server configuration is needed.');
  }
}

testEndpoints()
  .then(() => console.log('\nTesting complete!'))
  .catch(err => console.error('Testing failed:', err)); 