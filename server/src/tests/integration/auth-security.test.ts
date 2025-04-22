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

describe('Auth Security Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set JWT secret for testing
    process.env.JWT_SECRET = 'test_secret_key_for_testing_only';
  });

  describe('Account locking after failed login attempts', () => {
    it('should lock account after too many failed login attempts', async () => {
      // Create a hashed password
      const hashedPassword = await bcrypt.hash('CorrectPassword123', 10);
      
      // Setup to mock the failed attempts count
      let failedAttempts = 0;
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 30); // Lock expires 30 minutes in future
      
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query, params) => {
        // Track attempts and lock user after 5 failed attempts
        if (query.includes('INSERT INTO failed_login_attempts')) {
          failedAttempts++;
          return { rows: [], rowCount: 1 };
        }
        
        if (query.includes('SELECT * FROM users WHERE')) {
          return {
            rows: [{
              id: 1,
              email: 'test@example.com',
              username: 'testuser',
              name: 'Test User',
              password: hashedPassword,
              failed_login_attempts: failedAttempts,
              is_locked: failedAttempts >= 5,
              lock_expires: failedAttempts >= 5 ? futureDate : null
            }],
            rowCount: 1
          };
        }
        
        if (query.includes('UPDATE users SET failed_login_attempts')) {
          // Update the failed attempts count
          if (params && params.length > 0) {
            failedAttempts = params[0]; // The first parameter should be the new count
          }
          return { rows: [], rowCount: 1 };
        }
        
        if (query.includes('SELECT COUNT(*) FROM failed_login_attempts')) {
          return { 
            rows: [{ count: failedAttempts }], 
            rowCount: 1 
          };
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      // First attempt: wrong password
      await request(app)
        .post('/api/auth/login')
        .send({ login: 'test@example.com', password: 'WrongPassword123' })
        .expect(401);
      
      // Attempt 2: wrong password
      await request(app)
        .post('/api/auth/login')
        .send({ login: 'test@example.com', password: 'WrongPassword123' })
        .expect(401);
      
      // Attempt 3: wrong password
      await request(app)
        .post('/api/auth/login')
        .send({ login: 'test@example.com', password: 'WrongPassword123' })
        .expect(401);
      
      // Attempt 4: wrong password
      await request(app)
        .post('/api/auth/login')
        .send({ login: 'test@example.com', password: 'WrongPassword123' })
        .expect(401);
      
      // Attempt 5: wrong password - should lock account
      await request(app)
        .post('/api/auth/login')
        .send({ login: 'test@example.com', password: 'WrongPassword123' })
        .expect(401);
      
      // Set account to locked for next attempt
      failedAttempts = 5;
      
      // Attempt 6: correct password, but account should be locked
      const response = await request(app)
        .post('/api/auth/login')
        .send({ login: 'test@example.com', password: 'CorrectPassword123' })
        .expect(401);
      
      // Check response indicates account is locked
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Account is temporarily locked');
    });
    
    it('should unlock account when lock period expires', async () => {
      // Create a hashed password
      const hashedPassword = await bcrypt.hash('CorrectPassword123', 10);
      
      // Create a date in the past for expired lock
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 30); // Lock expired 30 minutes ago
      
      // Mock database responses
      (pool.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT * FROM users WHERE')) {
          return {
            rows: [{
              id: 1,
              email: 'test@example.com',
              username: 'testuser',
              name: 'Test User',
              password: hashedPassword,
              failed_login_attempts: 5,
              is_locked: true,
              lock_expires: pastDate,
              avatar_url: 'avatar.jpg',
              bio: 'Test bio',
              created_at: new Date(),
              updated_at: new Date()
            }],
            rowCount: 1
          };
        }
        
        if (query.includes('UPDATE users SET is_locked = false')) {
          return { rows: [], rowCount: 1 };
        }
        
        return { rows: [], rowCount: 0 };
      });
      
      // Attempt login with correct password
      const response = await request(app)
        .post('/api/auth/login')
        .send({ login: 'test@example.com', password: 'CorrectPassword123' })
        .expect(200);
      
      // Check response
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
      
      // Verify lock was reset
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET is_locked = false'),
        expect.arrayContaining([1])
      );
    });
  });

  describe('Password complexity requirements', () => {
    it('should reject registration with short password', async () => {
      // Test data with too short password
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Short1',
        username: 'testuser'
      };
      
      // Make API request
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Password must be at least 8 characters long');
    });
    
    it('should reject registration with password missing uppercase', async () => {
      // Test data with password missing uppercase
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser'
      };
      
      // Make API request
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('must include at least one uppercase letter');
    });
    
    it('should reject registration with password missing lowercase', async () => {
      // Test data with password missing lowercase
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'PASSWORD123',
        username: 'testuser'
      };
      
      // Make API request
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Password must include');
    });
    
    it('should reject registration with password missing numbers', async () => {
      // Test data with password missing numbers
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'PasswordOnly',
        username: 'testuser'
      };
      
      // Make API request
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      // Check response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Password must include');
    });
  });
}); 