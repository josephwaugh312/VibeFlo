import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set production mode
process.env.NODE_ENV = 'production';

// Disable SSL for local testing
process.env.DISABLE_SSL = 'true';

// Import and run the server
import './index'; 