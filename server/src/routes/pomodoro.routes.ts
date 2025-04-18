import express, { Request, Response } from 'express';
import pool from '../config/db';
import { protect } from '../middleware/auth.middleware';
import { User } from '../types';

const router = express.Router();

// Extend the Request type to include user
interface AuthRequest extends Request {
  user?: User;
}

/**
 * @route   POST /api/pomodoro/sessions
 * @desc    Create a new pomodoro session
 * @access  Private
 */
router.post('/sessions', protect, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - User ID is missing' });
    }
    
    const { duration, task, completed } = req.body;
    
    // Debug logging to see what's being received
    console.log('Received session data:', {
      userId,
      duration,
      task,
      taskType: typeof task,
      taskLength: task ? task.length : 0,
      completed
    });

    // Ensure task is a valid string
    const sanitizedTask = task && typeof task === 'string' && task.trim() 
      ? task.trim() 
      : 'Completed Pomodoro';

    console.log('Using sanitized task:', sanitizedTask);

    const newSession = await pool.query(
      'INSERT INTO pomodoro_sessions (user_id, duration, task, completed) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, duration, sanitizedTask, completed || false]
    );

    console.log('Created new session:', newSession.rows[0]);
    res.status(201).json(newSession.rows[0]);
  } catch (error) {
    console.error('Error creating pomodoro session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/pomodoro/sessions
 * @desc    Get all pomodoro sessions for the user
 * @access  Private
 */
router.get('/sessions', protect, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - User ID is missing' });
    }
    
    const sessionsResult = await pool.query(
      'SELECT * FROM pomodoro_sessions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(sessionsResult.rows);
  } catch (error) {
    console.error('Error fetching pomodoro sessions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/pomodoro/sessions/:id
 * @desc    Update a pomodoro session
 * @access  Private
 */
router.put('/sessions/:id', protect, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - User ID is missing' });
    }
    
    const sessionId = req.params.id;
    const { duration, task, completed } = req.body;
    
    // Verify that the session belongs to the user
    const sessionCheck = await pool.query(
      'SELECT * FROM pomodoro_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Pomodoro session not found or not owned by user' });
    }
    
    // Update session
    const updatedSession = await pool.query(
      'UPDATE pomodoro_sessions SET duration = $1, task = $2, completed = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
      [
        duration || sessionCheck.rows[0].duration,
        task || sessionCheck.rows[0].task,
        completed !== undefined ? completed : sessionCheck.rows[0].completed,
        sessionId,
        userId
      ]
    );
    
    res.json(updatedSession.rows[0]);
  } catch (error) {
    console.error('Error updating pomodoro session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/pomodoro/sessions/:id
 * @desc    Delete a pomodoro session
 * @access  Private
 */
router.delete('/sessions/:id', protect, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - User ID is missing' });
    }
    
    const sessionId = req.params.id;
    
    // Verify that the session belongs to the user
    const sessionCheck = await pool.query(
      'SELECT * FROM pomodoro_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Pomodoro session not found or not owned by user' });
    }
    
    // Delete session
    await pool.query('DELETE FROM pomodoro_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
    
    res.json({ message: 'Pomodoro session deleted successfully' });
  } catch (error) {
    console.error('Error deleting pomodoro session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/pomodoro/stats
 * @desc    Get pomodoro statistics for the user
 * @access  Private
 */
router.get('/stats', protect, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - User ID is missing' });
    }
    
    // Get total sessions
    const totalSessions = await pool.query(
      'SELECT COUNT(*) FROM pomodoro_sessions WHERE user_id = $1',
      [userId]
    );
    
    // Get completed sessions
    const completedSessions = await pool.query(
      'SELECT COUNT(*) FROM pomodoro_sessions WHERE user_id = $1 AND completed = true',
      [userId]
    );
    
    // Get total focus time (in minutes)
    const totalFocusTime = await pool.query(
      'SELECT SUM(duration) FROM pomodoro_sessions WHERE user_id = $1 AND completed = true',
      [userId]
    );
    
    // Get sessions by day for the last 7 days
    const last7DaysActivity = await pool.query(`
      SELECT 
        to_char(created_at, 'Day') as day_name,
        COUNT(*) as count,
        SUM(duration) as total_minutes
      FROM pomodoro_sessions 
      WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY day_name
      ORDER BY MIN(created_at)
    `, [userId]);
    
    // Get sessions by day for the last 30 days
    const last30DaysActivity = await pool.query(`
      SELECT 
        to_char(created_at, 'Day') as day_name,
        COUNT(*) as count,
        SUM(duration) as total_minutes
      FROM pomodoro_sessions 
      WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY day_name
      ORDER BY MIN(created_at)
    `, [userId]);
    
    // Get sessions by day for all time (limited to 90 days)
    const allTimeActivity = await pool.query(`
      SELECT 
        to_char(created_at, 'Day') as day_name,
        COUNT(*) as count,
        SUM(duration) as total_minutes
      FROM pomodoro_sessions 
      WHERE user_id = $1 AND created_at > NOW() - INTERVAL '90 days'
      GROUP BY day_name
      ORDER BY MIN(created_at)
    `, [userId]);
    
    // Calculate average session duration
    const avgSessionDuration = await pool.query(`
      SELECT AVG(duration) as avg_duration
      FROM pomodoro_sessions
      WHERE user_id = $1 AND completed = true
    `, [userId]);
    
    // Get most productive day (day with most focus time)
    const mostProductiveDay = await pool.query(`
      SELECT 
        to_char(created_at, 'Day') as day_name,
        SUM(duration) as total_minutes
      FROM pomodoro_sessions
      WHERE user_id = $1 AND completed = true
      GROUP BY day_name
      ORDER BY total_minutes DESC
      LIMIT 1
    `, [userId]);
    
    // Get average daily sessions
    const avgDailySessions = await pool.query(`
      SELECT AVG(session_count) as avg_count
      FROM (
        SELECT DATE(created_at) as session_date, COUNT(*) as session_count
        FROM pomodoro_sessions
        WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY session_date
      ) as daily_sessions
    `, [userId]);
    
    // Get completion trend (last 7 days vs previous 7 days)
    const completionTrend = await pool.query(`
      WITH last_week AS (
        SELECT COUNT(*) as completed_count
        FROM pomodoro_sessions
        WHERE user_id = $1 
        AND completed = true
        AND created_at > NOW() - INTERVAL '7 days'
      ),
      previous_week AS (
        SELECT COUNT(*) as completed_count
        FROM pomodoro_sessions
        WHERE user_id = $1 
        AND completed = true
        AND created_at > NOW() - INTERVAL '14 days'
        AND created_at <= NOW() - INTERVAL '7 days'
      )
      SELECT 
        COALESCE(last_week.completed_count, 0) as current_week,
        COALESCE(previous_week.completed_count, 0) as previous_week
      FROM last_week CROSS JOIN previous_week
    `, [userId]);
    
    // Calculate streak (consecutive days with completed sessions)
    const streakQuery = await pool.query(`
      WITH ranked_days AS (
        SELECT 
          DISTINCT DATE(created_at) as session_date
        FROM pomodoro_sessions
        WHERE user_id = $1 AND completed = true
        ORDER BY session_date DESC
      ),
      gaps AS (
        SELECT 
          session_date,
          LAG(session_date, 1) OVER (ORDER BY session_date DESC) as next_date,
          CASE
            WHEN LAG(session_date, 1) OVER (ORDER BY session_date DESC) IS NULL THEN 0
            WHEN session_date - LAG(session_date, 1) OVER (ORDER BY session_date DESC) = -1 THEN 0
            ELSE 1
          END as gap
        FROM ranked_days
      ),
      groups AS (
        SELECT
          session_date,
          SUM(gap) OVER (ORDER BY session_date DESC) as group_id
        FROM gaps
      )
      SELECT
        COUNT(*) as streak_length
      FROM groups
      WHERE group_id = 0
    `, [userId]);
    
    // Get activity heatmap data (for the last 90 days)
    const heatmapData = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as session_count,
        SUM(duration) as total_minutes
      FROM pomodoro_sessions
      WHERE user_id = $1 AND created_at > NOW() - INTERVAL '90 days'
      GROUP BY date
      ORDER BY date
    `, [userId]);
    
    // Convert the activity data into a more usable format
    const formatActivityData = (rows: any[]) => {
      const activityMap: {[key: string]: { count: number, totalMinutes: number }} = {};
      
      rows.forEach(row => {
        // Trim whitespace from day name and ensure first letter is capitalized
        const dayName = row.day_name.trim();
        
        activityMap[dayName] = {
          count: parseInt(row.count, 10),
          totalMinutes: parseInt(row.total_minutes, 10) || 0
        };
      });
      
      return activityMap;
    };
    
    // Format the heatmap data
    const formatHeatmapData = (rows: any[]) => {
      return rows.map(row => ({
        date: row.date,
        count: parseInt(row.session_count, 10),
        minutes: parseInt(row.total_minutes, 10) || 0
      }));
    };
    
    // Format the activity data
    const lastWeekActivity = formatActivityData(last7DaysActivity.rows);
    const last30DaysActivityData = formatActivityData(last30DaysActivity.rows);
    const allTimeActivityData = formatActivityData(allTimeActivity.rows);
    
    // Get the streak value
    const currentStreak = streakQuery.rows[0] ? parseInt(streakQuery.rows[0].streak_length, 10) : 0;
    
    // Get comparison between current and previous week's completed sessions
    const currentWeekSessions = completionTrend.rows[0] ? parseInt(completionTrend.rows[0].current_week, 10) : 0;
    const previousWeekSessions = completionTrend.rows[0] ? parseInt(completionTrend.rows[0].previous_week, 10) : 0;
    const weeklyChange = previousWeekSessions > 0 
      ? Math.round(((currentWeekSessions - previousWeekSessions) / previousWeekSessions) * 100) 
      : (currentWeekSessions > 0 ? 100 : 0);
    
    res.json({
      totalSessions: parseInt(totalSessions.rows[0].count, 10),
      completedSessions: parseInt(completedSessions.rows[0].count, 10),
      totalFocusTime: totalFocusTime.rows[0].sum || 0,
      lastWeekActivity: lastWeekActivity,
      last30DaysActivity: last30DaysActivityData,
      allTimeActivity: allTimeActivityData,
      // New detailed metrics
      averageSessionDuration: Math.round(parseFloat(avgSessionDuration.rows[0]?.avg_duration || '0')),
      mostProductiveDay: mostProductiveDay.rows[0] ? {
        day: mostProductiveDay.rows[0].day_name.trim(),
        minutes: parseInt(mostProductiveDay.rows[0].total_minutes, 10) || 0
      } : null,
      averageDailySessions: parseFloat(avgDailySessions.rows[0]?.avg_count || '0').toFixed(1),
      completionTrend: {
        currentWeek: currentWeekSessions,
        previousWeek: previousWeekSessions,
        percentChange: weeklyChange
      },
      currentStreak,
      activityHeatmap: formatHeatmapData(heatmapData.rows)
    });
  } catch (error) {
    console.error('Error fetching pomodoro stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/pomodoro/todos
 * @desc    Get all todo items for a user
 * @access  Private
 */
router.get('/todos', protect, async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/pomodoro/todos
 * @desc    Save todos for a user
 * @access  Private
 */
router.post('/todos', protect, async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error saving todos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/pomodoro/todos/:id
 * @desc    Update a specific todo
 * @access  Private
 */
router.put('/todos/:id', protect, async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/pomodoro/todos/:id
 * @desc    Delete a specific todo
 * @access  Private
 */
router.delete('/todos/:id', protect, async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 