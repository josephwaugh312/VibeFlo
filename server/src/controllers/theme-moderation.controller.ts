import { Request, Response } from 'express';
import pool from '../config/db';
import { User } from '../types';

interface AuthRequest extends Request {
  user?: User;
}

/**
 * Get pending themes that need moderation
 */
export const getPendingThemes = async (req: AuthRequest, res: Response) => {
  try {
    const query = `
      SELECT t.*, u.username, u.name as user_name
      FROM themes t
      JOIN users u ON t.user_id = u.id
      WHERE t.moderation_status = 'pending'
      ORDER BY t.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting pending themes:', error);
    res.status(500).json({ message: 'Server error getting pending themes' });
  }
};

/**
 * Approve a theme
 */
export const approveTheme = async (req: AuthRequest, res: Response) => {
  try {
    const { themeId } = req.params;
    
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const query = `
      UPDATE themes 
      SET 
        moderation_status = 'approved',
        is_public = true,
        moderation_date = CURRENT_TIMESTAMP,
        moderation_notes = $1
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      req.body.notes || 'Approved by admin',
      themeId
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    res.json({
      message: 'Theme approved successfully',
      theme: result.rows[0]
    });
  } catch (error) {
    console.error('Error approving theme:', error);
    res.status(500).json({ message: 'Server error approving theme' });
  }
};

/**
 * Reject a theme
 */
export const rejectTheme = async (req: AuthRequest, res: Response) => {
  try {
    const { themeId } = req.params;
    
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!req.body.reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    
    const query = `
      UPDATE themes 
      SET 
        moderation_status = 'rejected',
        is_public = false,
        moderation_date = CURRENT_TIMESTAMP,
        moderation_notes = $1
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      req.body.reason,
      themeId
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    res.json({
      message: 'Theme rejected successfully',
      theme: result.rows[0]
    });
  } catch (error) {
    console.error('Error rejecting theme:', error);
    res.status(500).json({ message: 'Server error rejecting theme' });
  }
};

/**
 * Report a theme
 */
export const reportTheme = async (req: AuthRequest, res: Response) => {
  try {
    const { themeId } = req.params;
    
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!req.body.reason) {
      return res.status(400).json({ message: 'Report reason is required' });
    }
    
    // Begin transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // First check if user has already reported this theme
      const checkQuery = `
        SELECT * FROM theme_reports 
        WHERE theme_id = $1 AND user_id = $2
      `;
      
      const checkResult = await client.query(checkQuery, [themeId, req.user.id]);
      
      if (checkResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'You have already reported this theme' });
      }
      
      // Create report
      const insertQuery = `
        INSERT INTO theme_reports (theme_id, user_id, reason)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      
      await client.query(insertQuery, [
        themeId,
        req.user.id,
        req.body.reason
      ]);
      
      // Update reported count and timestamp on theme
      const updateQuery = `
        UPDATE themes
        SET 
          reported_count = reported_count + 1,
          last_reported_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, [themeId]);
      
      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Theme not found' });
      }
      
      // If theme has been reported multiple times, mark it as pending again for re-review
      if (updateResult.rows[0].reported_count >= 3 && updateResult.rows[0].moderation_status === 'approved') {
        await client.query(`
          UPDATE themes
          SET moderation_status = 'pending',
              is_public = false,
              moderation_notes = 'Flagged for re-review due to multiple reports'
          WHERE id = $1
        `, [themeId]);
      }
      
      await client.query('COMMIT');
      
      res.json({
        message: 'Theme reported successfully. Thank you for helping keep our community safe.',
        themeReports: updateResult.rows[0].reported_count
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error reporting theme:', error);
    res.status(500).json({ message: 'Server error reporting theme' });
  }
};

/**
 * Get reported themes
 */
export const getReportedThemes = async (req: AuthRequest, res: Response) => {
  try {
    const query = `
      SELECT t.*, u.username, u.name as user_name, 
             COUNT(tr.id) as report_count,
             json_agg(json_build_object(
               'id', tr.id,
               'reason', tr.reason,
               'created_at', tr.created_at,
               'user_id', tr.user_id,
               'reporter_username', ru.username
             )) as reports
      FROM themes t
      JOIN users u ON t.user_id = u.id
      JOIN theme_reports tr ON t.id = tr.theme_id
      JOIN users ru ON tr.user_id = ru.id
      WHERE tr.status = 'pending'
      GROUP BY t.id, u.username, u.name
      ORDER BY t.reported_count DESC, t.last_reported_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting reported themes:', error);
    res.status(500).json({ message: 'Server error getting reported themes' });
  }
}; 