import { directApi } from '../helpers/direct-test-helper';
import { setupIntegrationTestMocks, generateTestToken } from './setupIntegrationTests';
import { mockPool } from '../mocks/db-mock';

// Set up mocks before any imports that use them
setupIntegrationTestMocks();

// Mock JWT module
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked-jwt-token'),
  verify: jest.fn().mockReturnValue({ id: 1, email: 'test@example.com' })
}));

describe('Pomodoro Routes', () => {
  const testUser = { id: 1, email: 'test@example.com', username: 'testuser' };
  
  const testSession = {
    id: 1,
    user_id: 1,
    task: 'Test Session',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
    completed: false,
    notes: 'Test notes'
  };

  const testTodo = {
    id: 'todo-1',
    text: 'Test Todo',
    completed: false,
    recordedInStats: false
  };

  // Generate a test token for authenticated requests
  const token = generateTestToken();

  beforeEach(() => {
    // Reset all mocks before each test
    mockPool.reset();
  });

  describe('GET /api/pomodoro/sessions', () => {
    it('should return sessions for the user', async () => {
      // Mock database response
      mockPool.setQueryResponses([
        {
          rows: [testSession],
          rowCount: 1
        }
      ]);

      // Use directApi instead of supertest
      const response = await directApi.get('/api/pomodoro/sessions', token);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(testSession.id);
    });

    it('should return 401 when no token is provided', async () => {
      // Use directApi without token
      const response = await directApi.get('/api/pomodoro/sessions');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/pomodoro/sessions', () => {
    it('should create a new session', async () => {
      // Mock database response
      mockPool.setQueryResponses([
        {
          rows: [testSession],
          rowCount: 1
        }
      ]);

      const sessionData = {
        task: 'New Session',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 25 * 60 * 1000).toISOString()
      };

      // Use directApi instead of supertest
      const response = await directApi.post('/api/pomodoro/sessions', sessionData, token);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(testSession.id);
    });

    it('should return 401 when no token is provided', async () => {
      const sessionData = {
        task: 'New Session',
        startTime: new Date().toISOString()
      };

      // Use directApi without token
      const response = await directApi.post('/api/pomodoro/sessions', sessionData);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/pomodoro/sessions/:id', () => {
    it('should update a session successfully', async () => {
      // Mock database responses
      mockPool.setQueryResponses([
        // First query checks if session exists and belongs to user
        {
          rows: [testSession],
          rowCount: 1
        },
        // Second query updates the session
        {
          rows: [{...testSession, completed: true}],
          rowCount: 1
        }
      ]);

      const updatedData = {
        task: 'Updated Task',
        completed: true
      };

      // Use directApi instead of supertest
      const response = await directApi.put(`/api/pomodoro/sessions/${testSession.id}`, updatedData, token);

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
    });

    it('should return 404 when session does not exist', async () => {
      // Mock database response showing session doesn't exist
      mockPool.setQueryResponses([
        {
          rows: [],
          rowCount: 0
        }
      ]);

      const updatedData = {
        task: 'Will Not Update',
        completed: true
      };

      // Use directApi instead of supertest
      const response = await directApi.put(`/api/pomodoro/sessions/999`, updatedData, token);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 401 when no token is provided', async () => {
      const updatedData = {
        task: 'Unauthorized Update',
        completed: true
      };

      // Use directApi without token
      const response = await directApi.put(`/api/pomodoro/sessions/${testSession.id}`, updatedData);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/pomodoro/sessions/:id', () => {
    it('should delete a session successfully', async () => {
      // Mock database responses
      mockPool.setQueryResponses([
        // First query checks if session exists and belongs to user
        {
          rows: [testSession],
          rowCount: 1
        },
        // Second query deletes the session
        {
          rows: [],
          rowCount: 1
        }
      ]);

      // Use directApi instead of supertest
      const response = await directApi.delete(`/api/pomodoro/sessions/${testSession.id}`, token);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');
    });

    it('should return 404 when session does not exist', async () => {
      // Mock database response showing session doesn't exist
      mockPool.setQueryResponses([
        {
          rows: [],
          rowCount: 0
        }
      ]);

      // Use directApi instead of supertest
      const response = await directApi.delete(`/api/pomodoro/sessions/999`, token);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 401 when no token is provided', async () => {
      // Use directApi without token
      const response = await directApi.delete(`/api/pomodoro/sessions/${testSession.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/pomodoro/stats', () => {
    it('should return stats for the user', async () => {
      // Mock database responses
      const mockStats = {
        totalSessions: 10,
        totalTime: 15000,
        completedSessions: 8
      };

      mockPool.setQueryResponses([
        // Stats query response
        {
          rows: [{count: mockStats.totalSessions}],
          rowCount: 1
        },
        // Total time query response
        {
          rows: [{sum: mockStats.totalTime}],
          rowCount: 1
        },
        // Completed sessions query response
        {
          rows: [{count: mockStats.completedSessions}],
          rowCount: 1
        }
      ]);

      // Use directApi instead of supertest
      const response = await directApi.get('/api/pomodoro/stats', token);

      expect(response.status).toBe(200);
      expect(response.body.totalSessions).toBe(mockStats.totalSessions);
      expect(response.body.totalTime).toBe(mockStats.totalTime);
      expect(response.body.completedSessions).toBe(mockStats.completedSessions);
    });

    it('should return 401 when no token is provided', async () => {
      // Use directApi without token
      const response = await directApi.get('/api/pomodoro/stats');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/pomodoro/todos', () => {
    it('should return todos for the user', async () => {
      // Mock database response
      mockPool.setQueryResponses([
        {
          rows: [{
            todo_id: testTodo.id,
            text: testTodo.text,
            completed: testTodo.completed,
            recorded_in_stats: testTodo.recordedInStats,
            position: 0
          }],
          rowCount: 1
        }
      ]);

      // Use directApi instead of supertest
      const response = await directApi.get('/api/pomodoro/todos', token);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(testTodo.id);
      expect(response.body[0].text).toBe(testTodo.text);
    });

    it('should return 401 when no token is provided', async () => {
      // Use directApi without token
      const response = await directApi.get('/api/pomodoro/todos');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/pomodoro/todos', () => {
    it('should save todos for the user', async () => {
      // Mock connect and queries
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
        release: jest.fn()
      };

      mockPool.setClientMock(mockClient);

      const todos = [testTodo];

      // Use directApi instead of supertest
      const response = await directApi.post('/api/pomodoro/todos', { todos }, token);

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(testTodo.id);
    });

    it('should return 400 when invalid todos data is provided', async () => {
      // Use directApi with invalid data
      const response = await directApi.post('/api/pomodoro/todos', { invalidData: true }, token);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid todos data');
    });

    it('should return 401 when no token is provided', async () => {
      const todos = [testTodo];

      // Use directApi without token
      const response = await directApi.post('/api/pomodoro/todos', { todos });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/pomodoro/todos/:id', () => {
    it('should update a todo successfully', async () => {
      // Mock database responses
      mockPool.setQueryResponses([
        // First query checks if todo exists and belongs to user
        {
          rows: [{
            todo_id: testTodo.id,
            text: testTodo.text,
            completed: testTodo.completed,
            recorded_in_stats: testTodo.recordedInStats,
            position: 0
          }],
          rowCount: 1
        },
        // Second query updates the todo
        {
          rows: [{
            todo_id: testTodo.id,
            text: 'Updated Todo',
            completed: true,
            recorded_in_stats: true,
            position: 0
          }],
          rowCount: 1
        }
      ]);

      const updatedData = {
        text: 'Updated Todo',
        completed: true,
        recordedInStats: true
      };

      // Use directApi instead of supertest
      const response = await directApi.put(`/api/pomodoro/todos/${testTodo.id}`, updatedData, token);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testTodo.id);
      expect(response.body.text).toBe('Updated Todo');
      expect(response.body.completed).toBe(true);
      expect(response.body.recordedInStats).toBe(true);
    });

    it('should return 404 when todo does not exist', async () => {
      // Mock database response showing todo doesn't exist
      mockPool.setQueryResponses([
        {
          rows: [],
          rowCount: 0
        }
      ]);

      const updatedData = {
        text: 'Will Not Update',
        completed: true
      };

      // Use directApi instead of supertest
      const response = await directApi.put(`/api/pomodoro/todos/non-existent-id`, updatedData, token);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 401 when no token is provided', async () => {
      const updatedData = {
        text: 'Unauthorized Update',
        completed: true
      };

      // Use directApi without token
      const response = await directApi.put(`/api/pomodoro/todos/${testTodo.id}`, updatedData);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/pomodoro/todos/:id', () => {
    it('should delete a todo successfully', async () => {
      // Mock database responses
      mockPool.setQueryResponses([
        // First query checks if todo exists and belongs to user
        {
          rows: [{
            todo_id: testTodo.id,
            text: testTodo.text,
            completed: testTodo.completed,
            recorded_in_stats: testTodo.recordedInStats,
            position: 0
          }],
          rowCount: 1
        },
        // Second query deletes the todo
        {
          rows: [],
          rowCount: 1
        },
        // Third query updates positions
        {
          rows: [],
          rowCount: 0
        }
      ]);

      // Use directApi instead of supertest
      const response = await directApi.delete(`/api/pomodoro/todos/${testTodo.id}`, token);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');
    });

    it('should return 404 when todo does not exist', async () => {
      // Mock database response showing todo doesn't exist
      mockPool.setQueryResponses([
        {
          rows: [],
          rowCount: 0
        }
      ]);

      // Use directApi instead of supertest
      const response = await directApi.delete(`/api/pomodoro/todos/non-existent-id`, token);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 401 when no token is provided', async () => {
      // Use directApi without token
      const response = await directApi.delete(`/api/pomodoro/todos/${testTodo.id}`);

      expect(response.status).toBe(401);
    });
  });
}); 