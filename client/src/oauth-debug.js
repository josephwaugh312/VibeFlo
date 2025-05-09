/**
 * OAuth Debug Script for VibeFlo
 * 
 * This script helps diagnose OAuth issues by testing the authentication flow locally
 * in production mode. It simulates the production environment but runs on your local machine.
 */

import axios from 'axios';

// Configuration - Edit these values as needed
const config = {
  // The base URL of your local server (defaults to production for testing)
  serverUrl: 'http://localhost:5001',
  
  // The URL that the OAuth provider should redirect to after authentication
  redirectUrl: 'http://localhost:3000/oauth-callback',
  
  // OAuth providers to test
  providers: ['google', 'github'],
  
  // Set to true to test with verbose logging
  verbose: true
};

// Create a test function for each provider
const testOAuthFlow = async (provider) => {
  console.log(`\n===== Testing ${provider} OAuth Flow =====`);
  
  try {
    // Step 1: Get the authorization URL
    console.log(`1. Getting ${provider} authorization URL from ${config.serverUrl}/api/auth/${provider}`);
    
    const response = await axios.get(`${config.serverUrl}/api/auth/${provider}/url`, {
      headers: { 'Accept': 'application/json' },
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400
    });
    
    if (config.verbose) {
      console.log('Response:', response.data);
    }
    
    // Step 2: Show the URL that the user would be redirected to
    if (response.data && response.data.authUrl) {
      console.log(`2. ${provider} authorization URL: ${response.data.authUrl}`);
      console.log(`   To manually test: Open this URL in your browser and complete authentication`);
    } else if (response.status === 302 && response.headers.location) {
      console.log(`2. ${provider} redirect: ${response.headers.location}`);
      console.log(`   To manually test: Open this URL in your browser and complete authentication`);
    } else {
      console.error(`Error: Could not get ${provider} authorization URL`);
    }
    
    // Step 3: Explain the expected callback process
    console.log(`3. After authentication, the provider should redirect to:`);
    console.log(`   ${config.serverUrl}/api/auth/${provider}/callback?code=[auth_code]`);
    console.log(`4. Then your server should redirect to:`);
    console.log(`   ${config.redirectUrl}?token=[jwt_token]`);
    
    return true;
  } catch (error) {
    console.error(`Error testing ${provider} OAuth flow:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
};

// Test server connectivity first
const testServerConnectivity = async () => {
  console.log(`\n===== Testing Server Connectivity =====`);
  try {
    const response = await axios.get(`${config.serverUrl}/api/health`);
    console.log(`Server status: ${response.status}`);
    console.log(`Server response:`, response.data);
    return true;
  } catch (error) {
    console.error('Server connectivity error:', error.message);
    console.error('Make sure your server is running locally at', config.serverUrl);
    return false;
  }
};

// Check environment variables
const checkEnvironmentVariables = async () => {
  console.log(`\n===== Checking Environment Variables =====`);
  try {
    const response = await axios.get(`${config.serverUrl}/api/auth/config-check`, {
      headers: { 'Accept': 'application/json' }
    });
    console.log('Environment variable check:', response.data);
    return true;
  } catch (error) {
    console.error('Environment variable check error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return false;
  }
};

// Run all tests
const runTests = async () => {
  console.log('Starting OAuth debug tests...');
  
  // Test server connectivity
  const serverOk = await testServerConnectivity();
  if (!serverOk) {
    console.error('Server connectivity test failed. Aborting remaining tests.');
    return;
  }
  
  // Check environment variables
  const envVarsOk = await checkEnvironmentVariables();
  if (!envVarsOk) {
    console.warn('Environment variable check failed. Continuing with remaining tests...');
  }
  
  // Test each OAuth provider
  for (const provider of config.providers) {
    await testOAuthFlow(provider);
  }
  
  console.log('\n===== All Tests Completed =====');
  console.log('To fully test the OAuth flow:');
  console.log('1. Start your server locally in production mode');
  console.log('2. Run this script');
  console.log('3. Use the generated authorization URLs to test the full flow manually');
};

// Run all tests when this script is executed directly
if (require.main === module) {
  runTests();
}

export { runTests, testOAuthFlow, testServerConnectivity }; 