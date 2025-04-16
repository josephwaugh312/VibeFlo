import request from 'supertest';
import pool from '../../config/db';
import { app } from '../../app';
import { generateTestToken, setupDbMock } from '../setupApiTests';

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
    // Reset query mock to avoid interference between tests
    (pool.query as jest.Mock).mockReset();
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
            { date: '2023-01-01', count: '2' },
            { date: '2023-01-02', count: '3' }
          ],
          rowCount: 2
        },
        // Monthly activity heatmap
        {
          rows: [
            { date: '2023-01-01', count: '2' },
            { date: '2023-01-02', count: '3' },
            { date: '2023-01-03', count: '1' }
          ],
          rowCount: 3
        }
      ]);
      
      const token = generateTestToken();
      
      // Test request
      const response = await request(app)
        .get('/api/pomodoro/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // Verify response structure
      expect(response.body).toHaveProperty('totalSessions');
      expect(response.body).toHaveProperty('completedSessions');
      expect(response.body).toHaveProperty('totalFocusTime');
      expect(response.body).toHaveProperty('last7DaysActivity');
      expect(response.body).toHaveProperty('monthlyActivityHeatmap');
      
      // Check specific values
      expect(response.body.totalSessions).toBe(10);
      expect(response.body.completedSessions).toBe(8);
      expect(response.body.totalFocusTime).toBe(200);
      expect(Array.isArray(response.body.last7DaysActivity)).toBe(true);
      expect(Array.isArray(response.body.monthlyActivityHeatmap)).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/pomodoro/stats')
        .expect(401);
      
      expect(response.body).toHaveProperty('message');
    });
  });
}); 