import request from 'supertest';
import pool from '../../config/db';
import { app } from '../../app';
import { generateTestToken, setupDbMock } from '../setupApiTests';
import { Request, Response, NextFunction } from 'express';

// Mock passport before importing it
jest.mock('passport', () => {
  return {
    use: jest.fn(),
    authenticate: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => {
      // Attach the user object directly to the request
      req.user = { 
        id: 1, 
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser'
      };
      return next();
    }),
    initialize: jest.fn().mockReturnValue((req: Request, res: Response, next: NextFunction) => next()),
    serializeUser: jest.fn(),
    deserializeUser: jest.fn()
  };
});

// Now import passport after mocking it
import passport from 'passport';

// Mock passport-jwt Strategy
jest.mock('passport-jwt', () => {
  return {
    Strategy: jest.fn(),
    ExtractJwt: {
      fromAuthHeaderAsBearerToken: jest.fn().mockReturnValue(() => 'dummy_function')
    }
  };
});

describe('Database initialization', () => {
  it('should be a valid test file', () => {
    expect(true).toBe(true);
  });
});

describe('Pomodoro API Endpoints', () => {
  // Mock data
  const testSession = {
    id: 1,
    user_id: 1,
    duration: 25,
    task: 'Test Task',
    completed: true,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset the passport authenticate mock for each test to allow overriding
    (passport.authenticate as jest.Mock).mockImplementation(() => (req: Request, res: Response, next: NextFunction) => {
      // Attach the user object directly to the request
      req.user = { 
        id: 1, 
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser'
      };
      return next();
    });
  });

  describe('POST /api/pomodoro/sessions', () => {
    it('should create a new pomodoro session when authenticated', async () => {
      // Set up database mock response
      setupDbMock(pool, [
        {
          rows: [testSession],
          rowCount: 1
        }
      ]);
      
      const token = generateTestToken();
      const sessionData = {
        duration: 25,
        task: 'Test Task',
        completed: true
      };
      
      // Test request
      const response = await request(app)
        .post('/api/pomodoro/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send(sessionData)
        .expect(201);
      
      // Verify response
      expect(response.body).toEqual(testSession);
      
      // Verify database was queried correctly
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO pomodoro_sessions'),
        expect.arrayContaining([1, 25, 'Test Task', true])
      );
    });

    it('should sanitize task input when empty or invalid', async () => {
      // Set up database mock response
      setupDbMock(pool, [
        {
          rows: [{...testSession, task: 'Completed Pomodoro'}],
          rowCount: 1
        }
      ]);
      
      const token = generateTestToken();
      const sessionData = {
        duration: 25,
        task: '', // Empty task
        completed: true
      };
      
      // Test request
      const response = await request(app)
        .post('/api/pomodoro/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send(sessionData)
        .expect(201);
      
      // Verify default task was used
      expect(response.body.task).toBe('Completed Pomodoro');
    });

    it('should return 401 when not authenticated', async () => {
      // Override the passport mock just for this test
      (passport.authenticate as jest.Mock).mockImplementationOnce(() => (req: Request, res: Response, next: NextFunction) => {
        return res.status(401).json({ message: 'Unauthorized' });
      });
      
      const response = await request(app)
        .post('/api/pomodoro/sessions')
        .send({
          duration: 25,
          task: 'Test Task',
          completed: true
        })
        .expect(401);
      
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/pomodoro/sessions', () => {
    it('should return all pomodoro sessions for the user', async () => {
      // Set up database mock response
      setupDbMock(pool, [
        {
          rows: [testSession, {...testSession, id: 2, task: 'Another Task'}],
          rowCount: 2
        }
      ]);
      
      const token = generateTestToken();
      
      // Test request
      const response = await request(app)
        .get('/api/pomodoro/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // Verify response structure
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toEqual(testSession);
      
      // Verify database was queried correctly
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM pomodoro_sessions WHERE user_id'),
        [1] // user ID
      );
    });

    it('should return 401 when not authenticated', async () => {
      // Override the passport mock just for this test
      (passport.authenticate as jest.Mock).mockImplementationOnce(() => (req: Request, res: Response, next: NextFunction) => {
        return res.status(401).json({ message: 'Unauthorized' });
      });
      
      const response = await request(app)
        .get('/api/pomodoro/sessions')
        .expect(401);
      
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/pomodoro/sessions/:id', () => {
    it('should update a pomodoro session', async () => {
      // Set up database mock responses
      setupDbMock(pool, [
        // Session existence check
        {
          rows: [testSession],
          rowCount: 1
        },
        // Update response
        {
          rows: [{...testSession, task: 'Updated Task'}],
          rowCount: 1
        }
      ]);
      
      const token = generateTestToken();
      const updateData = {
        task: 'Updated Task'
      };
      
      // Test request
      const response = await request(app)
        .put(`/api/pomodoro/sessions/${testSession.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);
      
      // Verify response
      expect(response.body.task).toBe('Updated Task');
      
      // Verify database queries
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('should return 404 when session does not exist', async () => {
      // Set up database mock response for session not found
      setupDbMock(pool, [
        {
          rows: [],
          rowCount: 0
        }
      ]);
      
      const token = generateTestToken();
      
      const response = await request(app)
        .put('/api/pomodoro/sessions/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ task: 'Updated Task' })
        .expect(404);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/pomodoro/sessions/:id', () => {
    it('should delete a pomodoro session', async () => {
      // Set up database mock responses
      setupDbMock(pool, [
        // Session existence check
        {
          rows: [testSession],
          rowCount: 1
        },
        // Delete operation
        {
          rows: [],
          rowCount: 1
        }
      ]);
      
      const token = generateTestToken();
      
      // Test request
      const response = await request(app)
        .delete(`/api/pomodoro/sessions/${testSession.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // Verify response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted successfully');
      
      // Verify database queries
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('should return 404 when session does not exist', async () => {
      // Set up database mock response for session not found
      setupDbMock(pool, [
        {
          rows: [],
          rowCount: 0
        }
      ]);
      
      const token = generateTestToken();
      
      const response = await request(app)
        .delete('/api/pomodoro/sessions/999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/pomodoro/stats', () => {
    it('should return pomodoro statistics for the user', async () => {
      // Set up database mock responses for each stat query
      setupDbMock(pool, [
        // Total sessions
        {
          rows: [{ count: '10' }],
          rowCount: 1
        },
        // Completed sessions
        {
          rows: [{ count: '8' }],
          rowCount: 1
        },
        // Total focus time
        {
          rows: [{ sum: '200' }],
          rowCount: 1
        },
        // Last 7 days activity
        {
          rows: [
            { day_name: 'Monday', count: '3', total_minutes: '75' },
            { day_name: 'Tuesday', count: '2', total_minutes: '50' }
          ],
          rowCount: 2
        },
        // Last 30 days activity
        {
          rows: [
            { day_name: 'Monday', count: '6', total_minutes: '150' },
            { day_name: 'Tuesday', count: '4', total_minutes: '100' }
          ],
          rowCount: 2
        },
        // All time activity
        {
          rows: [
            { day_name: 'Monday', count: '12', total_minutes: '300' },
            { day_name: 'Tuesday', count: '8', total_minutes: '200' }
          ],
          rowCount: 2
        },
        // Average session duration
        {
          rows: [{ avg_duration: '25' }],
          rowCount: 1
        },
        // Most productive day
        {
          rows: [{ day_name: 'Monday', total_minutes: '300' }],
          rowCount: 1
        }
      ]);
      
      const token = generateTestToken();
      
      // Test request
      const response = await request(app)
        .get('/api/pomodoro/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // Verify response structure - updated to match actual response keys
      expect(response.body).toHaveProperty('totalSessions');
      expect(response.body).toHaveProperty('completedSessions');
      expect(response.body).toHaveProperty('totalFocusTime');
      expect(response.body).toHaveProperty('lastWeekActivity');
      expect(response.body).toHaveProperty('last30DaysActivity');
      expect(response.body).toHaveProperty('allTimeActivity');
      expect(response.body).toHaveProperty('averageSessionDuration');
      expect(response.body).toHaveProperty('mostProductiveDay');
      
      // Verify values
      expect(response.body.totalSessions).toBe(10);
      expect(response.body.completedSessions).toBe(8);
      expect(response.body.totalFocusTime).toBe('200');  // The API returns it as a string
      expect(response.body.averageSessionDuration).toBe(25);
      expect(response.body.mostProductiveDay).toHaveProperty('day', 'Monday');
      expect(response.body.mostProductiveDay).toHaveProperty('minutes', 300);
    });

    it('should return 401 when not authenticated', async () => {
      // Override the passport mock just for this test
      (passport.authenticate as jest.Mock).mockImplementationOnce(() => (req: Request, res: Response, next: NextFunction) => {
        return res.status(401).json({ message: 'Unauthorized' });
      });
      
      const response = await request(app)
        .get('/api/pomodoro/stats')
        .expect(401);
      
      expect(response.body).toHaveProperty('message');
    });
  });
}); 