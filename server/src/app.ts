import express from 'express';
import cors from 'cors';
import passport from 'passport';
import path from 'path';
import apiRoutes from './routes';
import { errorMiddleware } from './utils/errorHandler';

// Initialize Express app
export const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.1.212:3000', 'https://vibeflo.onrender.com'], // Allow requests from client
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Increase JSON payload limit to 10MB to handle image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());

// Mount API routes
app.use('/api', apiRoutes);

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files
  app.use(express.static(path.join(__dirname, '../../client/build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
  });
} else {
  // Root route for development
  app.get('/', (req, res) => {
    res.send('VibeFlo API is running');
  });
}

// Error handling middleware - must be last
app.use(errorMiddleware); 