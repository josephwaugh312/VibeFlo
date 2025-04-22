import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../config/db';
import { app } from '../../app';

// Mock the database pool
jest.mock('../../config/db', () => {
  return {
    query: jest.fn(),
    connect: jest.fn().mockReturnValue({
      query: jest.fn(),
      release: jest.fn()
    })
  };
});

describe('Auth API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query) => {
        // Check for existing email or username
        if (query.includes('SELECT * FROM users WHERE email')) {
          return { rows: [], rowCount: 0 }; // No email exists
        }
        
        if (query.includes('SELECT * FROM users WHERE username')) {
          return { rows: [], rowCount: 0 }; // No username exists
        }
        
        // User creation
        if (query.includes('INSERT INTO users')) {
          return { 
            rows: [{ 
              id: 1, 
              name: 'Test User',
              username: 'testuser',
              email: 'test@example.com',
              is_verified: false
            }],
            rowCount: 1
          };
        }
        
        // Verification token creation
        if (query.includes('INSERT INTO verification_tokens')) {
          return { rows: [], rowCount: 1 };
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      // Test data with strong password
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        username: 'testuser'
      };
      
      // Make API request
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      // Check response
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('successful');
      
      // Check that query was called
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['Test User', 'testuser', 'test@example.com'])
      );
    });

    it('should return 400 if email is already in use', async () => {
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM users WHERE email')) {
          return { 
            rows: [{ id: 1, email: 'existing@example.com' }], 
            rowCount: 1 
          }; // Email exists
        }
        return { rows: [], rowCount: 0 };
      });
      
      // Test data with strong password
      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'Password123',
        username: 'testuser'
      };
      
      // Make API request
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login a user and return a token', async () => {
      // Create a hashed password
      const hashedPassword = await bcrypt.hash('Password123', 10);
      
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM users WHERE email') || query.includes('SELECT * FROM users WHERE username')) {
          return { 
            rows: [{ 
              id: 1, 
              email: 'test@example.com',
              username: 'testuser',
              name: 'Test User',
              password: hashedPassword,
              failed_login_attempts: 0,
              is_locked: false
            }], 
            rowCount: 1 
          };
        }
        
        if (query.includes('UPDATE users SET failed_login_attempts')) {
          return { rows: [], rowCount: 1 };
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      // Test data using login field
      const loginData = {
        login: 'test@example.com',
        password: 'Password123'
      };
      
      // Make API request
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);
      
      // Check response
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('message', 'Login successful');
      
      // Verify the token
      const token = response.body.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret_key_for_testing_only') as any;
      expect(decoded).toHaveProperty('id', 1);
    });

    it('should return 401 for invalid credentials', async () => {
      // Create a hashed password
      const hashedPassword = await bcrypt.hash('CorrectPassword123', 10);
      
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM users WHERE email') || query.includes('SELECT * FROM users WHERE username')) {
          return { 
            rows: [{ 
              id: 1, 
              email: 'test@example.com',
              username: 'testuser',
              name: 'Test User',
              password: hashedPassword,
              failed_login_attempts: 0,
              is_locked: false
            }], 
            rowCount: 1 
          };
        }
        
        if (query.includes('INSERT INTO failed_login_attempts')) {
          return { rows: [], rowCount: 1 };
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      // Test data with wrong password
      const loginData = {
        login: 'test@example.com',
        password: 'WrongPassword123'
      };
      
      // Make API request
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid credentials');
    });
  });
}); 