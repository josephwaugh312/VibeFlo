const https = require('https');

const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address to check');
  process.exit(1);
}

console.log(`Checking if user with email ${email} exists in the production database...`);

// Function to make a simple GET request to our API
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      // A chunk of data has been received
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // The whole response has been received
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (e) => {
      reject(e);
    });
  });
}

// Try to access the authenticated endpoint
async function createUser() {
  try {
    // Test if we can register a user with this email (if it's available)
    console.log(`Attempting to create a test user with email ${email}...`);
    
    // This is just a test - we'll see if registration returns a conflict error
    const testRegistration = await fetch('https://vibeflo-api.onrender.com/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        username: 'testuser' + Date.now(),
        email: email,
        password: 'TestPassword123'
      })
    });
    
    const result = await testRegistration.json();
    
    if (testRegistration.status === 409) {
      console.log(`❌ User with email ${email} already exists in the database.`);
      console.log('Error message:', result.message);
      return true;
    } else if (testRegistration.status === 201 || testRegistration.status === 200) {
      console.log(`✅ Successfully created a new user with email ${email}.`);
      console.log('This means the previous user was completely deleted!');
      return false;
    } else {
      console.log(`⚠️ Unexpected response: ${testRegistration.status}`);
      console.log('Response:', result);
      return null;
    }
  } catch (error) {
    console.error('Error checking user:', error);
    return null;
  }
}

createUser()
  .then(exists => {
    if (exists === null) {
      console.log('Could not determine if user exists');
      process.exit(2);
    } else {
      console.log('Result: User exists =', exists);
      process.exit(exists ? 1 : 0);
    }
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 