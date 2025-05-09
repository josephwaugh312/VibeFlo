require('dotenv').config();
const axios = require('axios');

const PROD_URL = 'https://vibeflo-api.onrender.com';

console.log('Testing login with POST request in production...');
console.log(`Base URL: ${PROD_URL}`);

// Use admin credentials
const loginData = {
  email: 'admin@vibeflo.com',
  password: 'admin123' // This is just a test - use real admin password for testing
};

async function testEndpoint() {
  console.log('\nTesting login endpoint with POST:');
  console.log('======================================================');
  
  // Test the login endpoint
  console.log(`\nTesting login: POST ${PROD_URL}/auth/login`);
  
  try {
    const response = await axios.post(`${PROD_URL}/auth/login`, loginData, {
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
      // Don't log the actual token
      const dataWithoutToken = { ...response.data };
      if (dataWithoutToken.token) {
        dataWithoutToken.token = '[REDACTED]';
      }
      console.log('Response data preview:', JSON.stringify(dataWithoutToken).substring(0, 200));
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
  
  console.log('\n======================================================');
  console.log('Note: If login credentials are incorrect, you will get a 401 error.');
  console.log('This test only verifies that the endpoint is working and returning JSON instead of HTML.');
}

testEndpoint()
  .then(() => console.log('\nTesting complete!'))
  .catch(err => console.error('Testing failed:', err)); 