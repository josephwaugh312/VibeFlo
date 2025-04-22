import express from 'express';
import cors from 'cors';
import passport from 'passport';
import apiRoutes from './routes';

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

// Root route
app.get('/', (req, res) => {
  res.send('VibeFlo API is running');
}); 