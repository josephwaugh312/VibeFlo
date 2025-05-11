import { Request, Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Create a new pomodoro session
 */
export const createPomodoroSession = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - User ID is missing' });
    }
    
    const { start_time, end_time, task, completed } = req.body;
    
    // Ensure task is a valid string
    const sanitizedTask = task && typeof task === 'string' && task.trim() 
      ? task.trim() 
      : 'Completed Pomodoro';
  
    // Use current time for start_time if not provided
    const effectiveStartTime = start_time || new Date();
    
    // For end_time, use provided value, or calculate from start time plus 25 minutes
    const effectiveEndTime = end_time || new Date(new Date(effectiveStartTime).getTime() + 25 * 60 * 1000);
  
    const newSession = await pool.query(
      'INSERT INTO pomodoro_sessions (user_id, start_time, end_time, task, completed) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, effectiveStartTime, effectiveEndTime, sanitizedTask, completed || false]
    );
  
    // Calculate duration in minutes to add to the response
    const startDate = new Date(newSession.rows[0].start_time);
    const endDate = new Date(newSession.rows[0].end_time);
    const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (60 * 1000));
    
    // Add calculated duration to the response
    const sessionWithDuration = {
      ...newSession.rows[0],
      duration: durationMinutes
    };
    
    res.status(201).json(sessionWithDuration);
  } catch (error) {
    console.error('Error creating pomodoro session:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all pomodoro sessions for the user
 */
export const getPomodoroSessions = async (req: Request, res: Response) => {
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
    
    res.status(200).json(sessionsResult.rows);
  } catch (error) {
    console.error('Error getting pomodoro sessions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a pomodoro session
 */
export const updatePomodoroSession = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - User ID is missing' });
    }
    
    const sessionId = req.params.id;
    const { start_time, end_time, task, completed } = req.body;
    
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
      'UPDATE pomodoro_sessions SET start_time = $1, end_time = $2, task = $3, completed = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [
        start_time || sessionCheck.rows[0].start_time,
        end_time || sessionCheck.rows[0].end_time,
        task || sessionCheck.rows[0].task,
        completed !== undefined ? completed : sessionCheck.rows[0].completed,
        sessionId,
        userId
      ]
    );
    
    // Calculate duration in minutes to add to the response
    const startDate = new Date(updatedSession.rows[0].start_time);
    const endDate = new Date(updatedSession.rows[0].end_time);
    const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (60 * 1000));
    
    // Add calculated duration to the response
    const sessionWithDuration = {
      ...updatedSession.rows[0],
      duration: durationMinutes
    };
    
    res.status(200).json(sessionWithDuration);
  } catch (error) {
    console.error('Error updating pomodoro session:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a pomodoro session
 */
export const deletePomodoroSession = async (req: Request, res: Response) => {
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
    
    res.status(200).json({ message: 'Pomodoro session deleted successfully' });
  } catch (error) {
    console.error('Error deleting pomodoro session:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get pomodoro statistics for the user
 */
export const getPomodoroStats = async (req: Request, res: Response) => {
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
    const totalMinutes = await pool.query(
      'SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))/60) as total_minutes FROM pomodoro_sessions WHERE user_id = $1 AND completed = true',
      [userId]
    );
    
    // Calculate average session duration
    const avgSessionDuration = await pool.query(
      'SELECT AVG(EXTRACT(EPOCH FROM (end_time - start_time))/60) as avg_minutes FROM pomodoro_sessions WHERE user_id = $1 AND completed = true',
      [userId]
    );
    
    // Parse numeric results from database
    const totalSessionsCount = parseInt(totalSessions.rows[0].count) || 0;
    const completedSessionsCount = parseInt(completedSessions.rows[0].count) || 0;
    const totalMinutesValue = Math.round(parseFloat(totalMinutes.rows[0]?.total_minutes || 0));
    const avgMinutesValue = Math.round(parseFloat(avgSessionDuration.rows[0]?.avg_minutes || 0));
    
    // Calculate completion rate
    const completionRate = totalSessionsCount > 0 
      ? Math.round((completedSessionsCount / totalSessionsCount) * 100) 
      : 0;
    
    // Construct and return stats object
    res.status(200).json({
      totalSessions: totalSessionsCount,
      completedSessions: completedSessionsCount,
      completionRate: completionRate,
      totalMinutes: totalMinutesValue,
      averageSessionMinutes: avgMinutesValue
    });
  } catch (error) {
    console.error('Error getting pomodoro stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 