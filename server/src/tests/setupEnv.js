/**
 * Set up environment variables for testing
 */

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Tell the app to use test mode
process.env.TEST_MODE = 'true';

// Provide a dummy database URL to prevent connection attempts
process.env.DATABASE_URL = 'postgresql://testuser:testpassword@localhost:5432/testdb';

// Provide a JWT secret for token signing/verification
process.env.JWT_SECRET = 'test_secret_key_for_testing_only';

// Set client URL for CORS
process.env.CLIENT_URL = 'http://localhost:3000';

// Set other required env variables with test values
process.env.EMAIL_SERVICE = 'test';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASSWORD = 'testpassword';
process.env.EMAIL_FROM = 'test@example.com';
process.env.YOUTUBE_API_KEY = 'dummy_youtube_api_key';

// Use in-memory session store
process.env.SESSION_STORE = 'memory'; 