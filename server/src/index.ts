import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import { connectDB } from './config/db';

// Import combined router
import apiRoutes from './routes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to PostgreSQL
connectDB();

// Middleware
// Configure CORS with explicit settings
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.1.212:3000', 'https://vibeflo.onrender.com'], // Allow requests from client
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
// Increase JSON payload limit to 10MB to handle image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware - required for Passport OAuth flows
app.use(session({
  secret: process.env.SESSION_SECRET || 'vibeflo_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session()); // This line is necessary for persistent login sessions

// Initialize passport strategies
import './config/passport';

// Mount API routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('VibeFlo API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Error handling
process.on('unhandledRejection', (err: Error) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  process.exit(1);
}); 