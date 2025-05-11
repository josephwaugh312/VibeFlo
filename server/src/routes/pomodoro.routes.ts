import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { handleAsync } from '../utils/errorHandler';
import * as pomodoroController from '../controllers/pomodoro.controller';

const router = Router();

/**
 * @route   POST /api/pomodoro/sessions
 * @desc    Create a new pomodoro session
 * @access  Private
 */
router.post('/sessions', protect, pomodoroController.createPomodoroSession);

/**
 * @route   GET /api/pomodoro/sessions
 * @desc    Get all pomodoro sessions for the user
 * @access  Private
 */
router.get('/sessions', protect, pomodoroController.getPomodoroSessions);

/**
 * @route   PUT /api/pomodoro/sessions/:id
 * @desc    Update a pomodoro session
 * @access  Private
 */
router.put('/sessions/:id', protect, pomodoroController.updatePomodoroSession);

/**
 * @route   DELETE /api/pomodoro/sessions/:id
 * @desc    Delete a pomodoro session
 * @access  Private
 */
router.delete('/sessions/:id', protect, pomodoroController.deletePomodoroSession);

/**
 * @route   GET /api/pomodoro/stats
 * @desc    Get pomodoro statistics for the user
 * @access  Private
 */
router.get('/stats', protect, pomodoroController.getPomodoroStats);

/**
 * @route   GET /api/pomodoro/todos
 * @desc    Get all todo items for a user
 * @access  Private
 */
router.get('/todos', protect, handleAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;
  
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized - User ID is missing' });
  }
  
  // Check if the user has any todos in the database
  const todosResult = await pool.query(
    'SELECT * FROM pomodoro_todos WHERE user_id = $1 ORDER BY position ASC',
    [userId]
  );
  
  // Map the database results to the expected format
  const todos = todosResult.rows.map(todo => ({
    id: todo.todo_id,
    text: todo.text,
    completed: todo.completed,
    recordedInStats: todo.recorded_in_stats
  }));
  
  res.json(todos);
}));

/**
 * @route   POST /api/pomodoro/todos
 * @desc    Save todos for a user
 * @access  Private
 */
router.post('/todos', protect, handleAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;
  
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized - User ID is missing' });
  }
  
  const { todos } = req.body;
  
  if (!todos || !Array.isArray(todos)) {
    return res.status(400).json({ message: 'Invalid todos data' });
  }
  
  // Start a transaction to ensure all todos are saved or none
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete all existing todos for this user
    await client.query('DELETE FROM pomodoro_todos WHERE user_id = $1', [userId]);
    
    // Insert the new todos
    for (let i = 0; i < todos.length; i++) {
      const todo = todos[i];
      await client.query(
        'INSERT INTO pomodoro_todos (user_id, todo_id, text, completed, recorded_in_stats, position) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, todo.id, todo.text, todo.completed, todo.recordedInStats || false, i]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json(todos);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

/**
 * @route   PUT /api/pomodoro/todos/:id
 * @desc    Update a specific todo
 * @access  Private
 */
router.put('/todos/:id', protect, handleAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;
  
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized - User ID is missing' });
  }
  
  const todoId = req.params.id;
  const { text, completed, recordedInStats } = req.body;
  
  // Verify that the todo belongs to the user
  const todoCheck = await pool.query(
    'SELECT * FROM pomodoro_todos WHERE todo_id = $1 AND user_id = $2',
    [todoId, userId]
  );
  
  if (todoCheck.rows.length === 0) {
    return res.status(404).json({ message: 'Todo not found or not owned by user' });
  }
  
  // Update todo
  const updatedTodo = await pool.query(
    'UPDATE pomodoro_todos SET text = $1, completed = $2, recorded_in_stats = $3 WHERE todo_id = $4 AND user_id = $5 RETURNING *',
    [
      text !== undefined ? text : todoCheck.rows[0].text,
      completed !== undefined ? completed : todoCheck.rows[0].completed,
      recordedInStats !== undefined ? recordedInStats : todoCheck.rows[0].recorded_in_stats,
      todoId,
      userId
    ]
  );
  
  res.json({
    id: updatedTodo.rows[0].todo_id,
    text: updatedTodo.rows[0].text,
    completed: updatedTodo.rows[0].completed,
    recordedInStats: updatedTodo.rows[0].recorded_in_stats
  });
}));

/**
 * @route   DELETE /api/pomodoro/todos/:id
 * @desc    Delete a specific todo
 * @access  Private
 */
router.delete('/todos/:id', protect, handleAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;
  
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized - User ID is missing' });
  }
  
  const todoId = req.params.id;
  
  // Verify that the todo belongs to the user
  const todoCheck = await pool.query(
    'SELECT * FROM pomodoro_todos WHERE todo_id = $1 AND user_id = $2',
    [todoId, userId]
  );
  
  if (todoCheck.rows.length === 0) {
    return res.status(404).json({ message: 'Todo not found or not owned by user' });
  }
  
  // Delete todo
  await pool.query('DELETE FROM pomodoro_todos WHERE todo_id = $1 AND user_id = $2', [todoId, userId]);
  
  // Update the positions of remaining todos
  await pool.query(`
    WITH ranked AS (
      SELECT todo_id, ROW_NUMBER() OVER (ORDER BY position) - 1 as new_position
      FROM pomodoro_todos
      WHERE user_id = $1
    )
    UPDATE pomodoro_todos
    SET position = ranked.new_position
    FROM ranked
    WHERE pomodoro_todos.todo_id = ranked.todo_id AND user_id = $1
  `, [userId]);
  
  res.json({ message: 'Todo deleted successfully' });
}));

export default router; 