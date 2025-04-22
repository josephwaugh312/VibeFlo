import { Request, Response } from 'express';
import pool from '../config/db';
import * as fs from 'fs';
import * as path from 'path';

// Security check - only allow in development or with specific secret key
const checkMigrationAuth = (req: Request): boolean => {
  const { key } = req.query;
  const migrationKey = process.env.MIGRATION_KEY;
  
  if (!migrationKey) {
    return process.env.NODE_ENV !== 'production';
  }
  
  return key === migrationKey;
};

export const runSchemaSetup = async (req: Request, res: Response) => {
  if (!checkMigrationAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Instead of reading the file, execute the schema directly
    // This avoids file path issues in production
    await pool.query(`
      -- Users Table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        username VARCHAR(50) UNIQUE,
        bio TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user'
      );

      -- Theme Categories Table
      CREATE TABLE IF NOT EXISTS theme_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Themes Table
      CREATE TABLE IF NOT EXISTS themes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        background_url VARCHAR(255),
        gradient_colors JSONB,
        category_id INTEGER REFERENCES theme_categories(id),
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        is_public BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'pending',
        reviewed_by UUID REFERENCES users(id),
        review_notes TEXT
      );

      -- Songs Table
      CREATE TABLE IF NOT EXISTS songs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        album VARCHAR(255),
        duration INTEGER,
        cover_url VARCHAR(255),
        audio_url VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Playlists Table
      CREATE TABLE IF NOT EXISTS playlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        cover_url VARCHAR(255),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Playlist Songs Table (Junction Table)
      CREATE TABLE IF NOT EXISTS playlist_songs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
        song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
        added_at TIMESTAMPTZ DEFAULT NOW(),
        position INTEGER NOT NULL,
        UNIQUE(playlist_id, song_id)
      );

      -- Settings Table
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        theme_id UUID REFERENCES themes(id),
        pomodoro_work_duration INTEGER DEFAULT 25,
        pomodoro_break_duration INTEGER DEFAULT 5,
        pomodoro_long_break_duration INTEGER DEFAULT 15,
        pomodoro_cycles INTEGER DEFAULT 4,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Pomodoro Sessions Table
      CREATE TABLE IF NOT EXISTS pomodoro_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Insert default data
    await pool.query(`
      -- Insert default theme categories
      INSERT INTO theme_categories (name, description)
      VALUES 
        ('Nature', 'Themes inspired by natural landscapes'),
        ('Abstract', 'Abstract and geometric patterns'),
        ('Minimal', 'Clean and minimalist designs'),
        ('Cozy', 'Warm and comfortable environments'),
        ('Focus', 'Distraction-free themes for maximum productivity')
      ON CONFLICT (name) DO NOTHING;

      -- Insert default admin user if not exists
      INSERT INTO users (id, email, password, first_name, last_name, username, is_verified, role)
      VALUES (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'admin@vibeflo.com',
        '$2b$10$NVyj5bKeOlQwZ19aYnkzWOEaLPIDcB6FOcvMxN0Cj1UuM/FQMq.aG', -- 'password123'
        'Admin',
        'User',
        'admin',
        TRUE,
        'admin'
      ) ON CONFLICT (email) DO NOTHING;
    `);

    // Create todos table separately
    await pool.query(`
      -- Create pomodoro_todos table with correct user_id type
      DROP TABLE IF EXISTS pomodoro_todos;
      CREATE TABLE IF NOT EXISTS pomodoro_todos (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        todo_id TEXT NOT NULL,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        recorded_in_stats BOOLEAN DEFAULT FALSE,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create index for faster queries by user_id
      CREATE INDEX IF NOT EXISTS pomodoro_todos_user_id_idx ON pomodoro_todos (user_id);

      -- Create unique constraint on user_id and todo_id to prevent duplicates
      CREATE UNIQUE INDEX IF NOT EXISTS pomodoro_todos_user_id_todo_id_idx ON pomodoro_todos (user_id, todo_id);
    `);
    
    return res.status(200).json({ message: 'Schema applied successfully' });
  } catch (error: any) {
    console.error('Error applying schema:', error);
    return res.status(500).json({ error: `Error applying schema: ${error?.message || 'Unknown error'}` });
  }
};

export const runUsernameMigration = async (req: Request, res: Response) => {
  if (!checkMigrationAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await pool.query(`
      ALTER TABLE IF EXISTS users
      ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
    `);
    
    return res.status(200).json({ 
      message: 'Username migration applied successfully',
      result 
    });
  } catch (error: any) {
    console.error('Error applying username migration:', error);
    return res.status(500).json({ error: `Error applying username migration: ${error?.message || 'Unknown error'}` });
  }
};

export const runBioMigration = async (req: Request, res: Response) => {
  if (!checkMigrationAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await pool.query(`
      ALTER TABLE IF EXISTS users
      ADD COLUMN IF NOT EXISTS bio TEXT;
    `);
    
    return res.status(200).json({ 
      message: 'Bio migration applied successfully',
      result 
    });
  } catch (error: any) {
    console.error('Error applying bio migration:', error);
    return res.status(500).json({ error: `Error applying bio migration: ${error?.message || 'Unknown error'}` });
  }
};

export const runVerificationMigration = async (req: Request, res: Response) => {
  if (!checkMigrationAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await pool.query(`
      ALTER TABLE IF EXISTS users
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verification_token VARCHAR(100);
    `);
    
    return res.status(200).json({ 
      message: 'Verification migration applied successfully',
      result 
    });
  } catch (error: any) {
    console.error('Error applying verification migration:', error);
    return res.status(500).json({ error: `Error applying verification migration: ${error?.message || 'Unknown error'}` });
  }
};

export const runThemeModerationMigration = async (req: Request, res: Response) => {
  if (!checkMigrationAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await pool.query(`
      ALTER TABLE IF EXISTS themes
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS reviewed_by UUID,
      ADD COLUMN IF NOT EXISTS review_notes TEXT;
    `);
    
    return res.status(200).json({ 
      message: 'Theme moderation migration applied successfully',
      result 
    });
  } catch (error: any) {
    console.error('Error applying theme moderation migration:', error);
    return res.status(500).json({ error: `Error applying theme moderation migration: ${error?.message || 'Unknown error'}` });
  }
};

export const runAuthTablesMigration = async (req: Request, res: Response) => {
  if (!checkMigrationAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await pool.query(`
      -- Create failed login attempts table
      CREATE TABLE IF NOT EXISTS failed_login_attempts (
        id SERIAL PRIMARY KEY,
        login_identifier VARCHAR(255) NOT NULL,
        ip_address VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create verification tokens table
      CREATE TABLE IF NOT EXISTS verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Add missing columns to users table
      ALTER TABLE IF EXISTS users
      ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS lock_expires TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);
    `);
    
    return res.status(200).json({ 
      message: 'Auth tables migration applied successfully',
      result 
    });
  } catch (error: any) {
    console.error('Error applying auth tables migration:', error);
    return res.status(500).json({ error: `Error applying auth tables migration: ${error?.message || 'Unknown error'}` });
  }
};

export const runThemeFixesMigration = async (req: Request, res: Response) => {
  if (!checkMigrationAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await pool.query(`
      -- Add missing columns to themes table
      ALTER TABLE IF EXISTS themes
      ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(255);

      -- Add missing columns to user_settings table
      ALTER TABLE IF EXISTS user_settings
      ADD COLUMN IF NOT EXISTS default_theme_id UUID REFERENCES themes(id);

      -- Temporarily disable email verification requirement
      UPDATE users SET is_verified = TRUE WHERE is_verified = FALSE;
    `);
    
    return res.status(200).json({ 
      message: 'Theme fixes migration applied successfully',
      result 
    });
  } catch (error: any) {
    console.error('Error applying theme fixes migration:', error);
    return res.status(500).json({ error: `Error applying theme fixes migration: ${error?.message || 'Unknown error'}` });
  }
};

export const runAllMigrations = async (req: Request, res: Response) => {
  if (!checkMigrationAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Running schema setup...');
    await pool.query(`
      -- Users Table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        username VARCHAR(50) UNIQUE,
        bio TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user'
      );

      -- Theme Categories Table
      CREATE TABLE IF NOT EXISTS theme_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Themes Table
      CREATE TABLE IF NOT EXISTS themes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        background_url VARCHAR(255),
        gradient_colors JSONB,
        category_id INTEGER REFERENCES theme_categories(id),
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        is_public BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'pending',
        reviewed_by UUID REFERENCES users(id),
        review_notes TEXT
      );

      -- Songs Table
      CREATE TABLE IF NOT EXISTS songs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        album VARCHAR(255),
        duration INTEGER,
        cover_url VARCHAR(255),
        audio_url VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Playlists Table
      CREATE TABLE IF NOT EXISTS playlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        cover_url VARCHAR(255),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Playlist Songs Table (Junction Table)
      CREATE TABLE IF NOT EXISTS playlist_songs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
        song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
        added_at TIMESTAMPTZ DEFAULT NOW(),
        position INTEGER NOT NULL,
        UNIQUE(playlist_id, song_id)
      );

      -- Settings Table
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        theme_id UUID REFERENCES themes(id),
        pomodoro_work_duration INTEGER DEFAULT 25,
        pomodoro_break_duration INTEGER DEFAULT 5,
        pomodoro_long_break_duration INTEGER DEFAULT 15,
        pomodoro_cycles INTEGER DEFAULT 4,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Pomodoro Sessions Table
      CREATE TABLE IF NOT EXISTS pomodoro_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Schema setup completed');

    // Insert default data
    console.log('Inserting default data...');
    await pool.query(`
      -- Insert default theme categories
      INSERT INTO theme_categories (name, description)
      VALUES 
        ('Nature', 'Themes inspired by natural landscapes'),
        ('Abstract', 'Abstract and geometric patterns'),
        ('Minimal', 'Clean and minimalist designs'),
        ('Cozy', 'Warm and comfortable environments'),
        ('Focus', 'Distraction-free themes for maximum productivity')
      ON CONFLICT (name) DO NOTHING;

      -- Insert default admin user if not exists
      INSERT INTO users (id, email, password, first_name, last_name, username, is_verified, role)
      VALUES (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'admin@vibeflo.com',
        '$2b$10$NVyj5bKeOlQwZ19aYnkzWOEaLPIDcB6FOcvMxN0Cj1UuM/FQMq.aG', -- 'password123'
        'Admin',
        'User',
        'admin',
        TRUE,
        'admin'
      ) ON CONFLICT (email) DO NOTHING;
    `);
    console.log('Default data inserted');

    // Create todos table separately
    console.log('Creating todos table...');
    await pool.query(`
      -- Create pomodoro_todos table with correct user_id type
      DROP TABLE IF EXISTS pomodoro_todos;
      CREATE TABLE IF NOT EXISTS pomodoro_todos (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        todo_id TEXT NOT NULL,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        recorded_in_stats BOOLEAN DEFAULT FALSE,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create index for faster queries by user_id
      CREATE INDEX IF NOT EXISTS pomodoro_todos_user_id_idx ON pomodoro_todos (user_id);

      -- Create unique constraint on user_id and todo_id to prevent duplicates
      CREATE UNIQUE INDEX IF NOT EXISTS pomodoro_todos_user_id_todo_id_idx ON pomodoro_todos (user_id, todo_id);
    `);
    console.log('Todos table created');

    // Add auth tables migration
    console.log('Creating auth tables...');
    await pool.query(`
      -- Create failed login attempts table
      CREATE TABLE IF NOT EXISTS failed_login_attempts (
        id SERIAL PRIMARY KEY,
        login_identifier VARCHAR(255) NOT NULL,
        ip_address VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create verification tokens table
      CREATE TABLE IF NOT EXISTS verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Add missing columns to users table
      ALTER TABLE IF EXISTS users
      ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS lock_expires TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);
    `);
    console.log('Auth tables created');

    // Add theme fixes migration
    console.log('Applying theme fixes...');
    await pool.query(`
      -- Add missing columns to themes table
      ALTER TABLE IF EXISTS themes
      ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(255);

      -- Add missing columns to user_settings table
      ALTER TABLE IF EXISTS user_settings
      ADD COLUMN IF NOT EXISTS default_theme_id UUID REFERENCES themes(id);

      -- Temporarily disable email verification requirement
      UPDATE users SET is_verified = TRUE WHERE is_verified = FALSE;
    `);
    console.log('Theme fixes applied');
    
    return res.status(200).json({ message: 'All migrations applied successfully' });
  } catch (error: any) {
    console.error('Error applying migrations:', error);
    return res.status(500).json({ error: `Error applying migrations: ${error?.message || 'Unknown error'}` });
  }
};

export const runFullSchemaMigration = async (req: Request, res: Response) => {
  if (!checkMigrationAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Create the update_pomodoro_todos_updated_at function
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_pomodoro_todos_updated_at() RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$;
    `);
    
    // Create custom_themes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS custom_themes (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        is_public BOOLEAN DEFAULT false,
        prompt TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        moderation_status VARCHAR(20) DEFAULT 'pending',
        moderation_notes TEXT,
        moderation_date TIMESTAMPTZ,
        reported_count INTEGER DEFAULT 0,
        last_reported_at TIMESTAMPTZ,
        CONSTRAINT custom_themes_moderation_status_check 
          CHECK (moderation_status IN ('pending', 'approved', 'rejected'))
      );
    `);
    
    // Create playlist_songs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS playlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS songs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        album VARCHAR(255),
        duration INTEGER,
        cover_url VARCHAR(255),
        audio_url VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS playlist_songs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
        song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
        added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        position INTEGER NOT NULL,
        UNIQUE(playlist_id, song_id)
      );
    `);
    
    // Create pomodoro_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pomodoro_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ,
        completed BOOLEAN DEFAULT FALSE,
        total_work_time INTEGER,
        total_break_time INTEGER,
        work_cycles_completed INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create pomodoro_todos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pomodoro_todos (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        todo_id TEXT NOT NULL,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        recorded_in_stats BOOLEAN DEFAULT FALSE,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS pomodoro_todos_user_id_idx ON pomodoro_todos (user_id);
      CREATE UNIQUE INDEX IF NOT EXISTS pomodoro_todos_user_id_todo_id_idx ON pomodoro_todos (user_id, todo_id);
      
      DROP TRIGGER IF EXISTS pomodoro_todos_updated_at_trigger ON pomodoro_todos;
      CREATE TRIGGER pomodoro_todos_updated_at_trigger
      BEFORE UPDATE ON pomodoro_todos
      FOR EACH ROW
      EXECUTE FUNCTION update_pomodoro_todos_updated_at();
    `);
    
    // Create theme_reports table 
    await pool.query(`
      CREATE TABLE IF NOT EXISTS theme_reports (
        id SERIAL PRIMARY KEY,
        theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Update themes table with missing columns
    await pool.query(`
      ALTER TABLE IF EXISTS themes
      ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(255);
    `);
    
    // Update user_settings table with missing columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        theme_id UUID REFERENCES themes(id),
        default_theme_id UUID REFERENCES themes(id),
        pomodoro_work_duration INTEGER DEFAULT 25,
        pomodoro_break_duration INTEGER DEFAULT 5,
        pomodoro_long_break_duration INTEGER DEFAULT 15,
        pomodoro_cycles INTEGER DEFAULT 4,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Update users table with missing columns
    await pool.query(`
      ALTER TABLE IF EXISTS users
      ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS lock_expires TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255),
      ADD COLUMN IF NOT EXISTS google_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS github_id VARCHAR(100);
    `);
    
    // Create verification_tokens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create reset_tokens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Temporarily disable email verification requirement
    await pool.query(`
      UPDATE users SET is_verified = TRUE WHERE is_verified = FALSE;
    `);
    
    // Create a default theme if none exists
    await pool.query(`
      INSERT INTO themes (name, description, is_default, background_url, is_public, status)
      VALUES ('Default Theme', 'The default application theme', TRUE, 'https://images.unsplash.com/photo-1544511916-0148ccdeb877', TRUE, 'approved')
      ON CONFLICT DO NOTHING;
    `);
    
    return res.status(200).json({ 
      message: 'Full schema migration applied successfully'
    });
  } catch (error: any) {
    console.error('Error applying full schema migration:', error);
    return res.status(500).json({ error: `Error applying full schema migration: ${error?.message || 'Unknown error'}` });
  }
};

export const runFixAllTables = async (req: Request, res: Response) => {
  if (!checkMigrationAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting comprehensive database reset and rebuild...');
    
    // First, drop all tables to start clean
    await pool.query(`
      DROP TABLE IF EXISTS 
        pomodoro_todos,
        pomodoro_sessions,
        playlist_songs, 
        playlists,
        songs,
        theme_reports,
        custom_themes,
        user_settings,
        themes,
        theme_categories,
        reset_tokens,
        verification_tokens,
        failed_login_attempts,
        users
      CASCADE;
      
      DROP FUNCTION IF EXISTS update_pomodoro_todos_updated_at() CASCADE;
    `);
    console.log('All existing tables dropped successfully');
    
    // Create or update users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        name VARCHAR(100),
        username VARCHAR(50) UNIQUE,
        bio TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        failed_login_attempts INTEGER DEFAULT 0,
        is_locked BOOLEAN DEFAULT FALSE,
        lock_expires TIMESTAMPTZ,
        avatar_url VARCHAR(255),
        google_id VARCHAR(100),
        facebook_id VARCHAR(100),
        github_id VARCHAR(100)
      );
    `);
    console.log('Users table created');
    
    // Create or update theme_categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS theme_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Theme categories table created');
    
    // Create or update themes table with all required columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS themes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        background_url VARCHAR(255),
        thumbnail_url VARCHAR(255),
        gradient_colors JSONB,
        category_id INTEGER REFERENCES theme_categories(id),
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        is_public BOOLEAN DEFAULT FALSE,
        is_default BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'pending',
        reviewed_by UUID REFERENCES users(id),
        review_notes TEXT
      );
    `);
    console.log('Themes table created');
    
    // Create or update songs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS songs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        album VARCHAR(255),
        duration INTEGER,
        cover_url VARCHAR(255),
        audio_url VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Songs table created');
    
    // Create or update playlists table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS playlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        cover_url VARCHAR(255),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Playlists table created');
    
    // Create or update playlist_songs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS playlist_songs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
        song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
        added_at TIMESTAMPTZ DEFAULT NOW(),
        position INTEGER NOT NULL,
        UNIQUE(playlist_id, song_id)
      );
    `);
    console.log('Playlist songs table created');
    
    // Create or update user_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        theme_id UUID REFERENCES themes(id),
        default_theme_id UUID REFERENCES themes(id),
        pomodoro_work_duration INTEGER DEFAULT 25,
        pomodoro_break_duration INTEGER DEFAULT 5,
        pomodoro_long_break_duration INTEGER DEFAULT 15,
        pomodoro_cycles INTEGER DEFAULT 4,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('User settings table created');
    
    // Create or update pomodoro_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pomodoro_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ,
        completed BOOLEAN DEFAULT FALSE,
        total_work_time INTEGER,
        total_break_time INTEGER,
        work_cycles_completed INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Pomodoro sessions table created');
    
    // Create update_pomodoro_todos_updated_at function and trigger
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_pomodoro_todos_updated_at() RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$;
    `);
    
    // Create or update pomodoro_todos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pomodoro_todos (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        todo_id TEXT NOT NULL,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        recorded_in_stats BOOLEAN DEFAULT FALSE,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS pomodoro_todos_user_id_idx ON pomodoro_todos (user_id);
      CREATE UNIQUE INDEX IF NOT EXISTS pomodoro_todos_user_id_todo_id_idx ON pomodoro_todos (user_id, todo_id);
      
      DROP TRIGGER IF EXISTS pomodoro_todos_updated_at_trigger ON pomodoro_todos;
      CREATE TRIGGER pomodoro_todos_updated_at_trigger
      BEFORE UPDATE ON pomodoro_todos
      FOR EACH ROW
      EXECUTE FUNCTION update_pomodoro_todos_updated_at();
    `);
    console.log('Pomodoro todos table created');
    
    // Create authentication-related tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS failed_login_attempts (
        id SERIAL PRIMARY KEY,
        login_identifier VARCHAR(255) NOT NULL,
        ip_address VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Authentication tables created');
    
    // Create theme_reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS theme_reports (
        id SERIAL PRIMARY KEY,
        theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Theme reports table created');
    
    // Create custom_themes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS custom_themes (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        is_public BOOLEAN DEFAULT false,
        prompt TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        moderation_status VARCHAR(20) DEFAULT 'pending',
        moderation_notes TEXT,
        moderation_date TIMESTAMPTZ,
        reported_count INTEGER DEFAULT 0,
        last_reported_at TIMESTAMPTZ,
        CONSTRAINT custom_themes_moderation_status_check 
          CHECK (moderation_status IN ('pending', 'approved', 'rejected'))
      );
    `);
    console.log('Custom themes table created');
    
    // Insert default data
    await pool.query(`
      -- Insert default theme categories
      INSERT INTO theme_categories (name, description)
      VALUES 
        ('Nature', 'Themes inspired by natural landscapes'),
        ('Abstract', 'Abstract and geometric patterns'),
        ('Minimal', 'Clean and minimalist designs'),
        ('Cozy', 'Warm and comfortable environments'),
        ('Focus', 'Distraction-free themes for maximum productivity');
      
      -- Insert default admin user
      INSERT INTO users (id, email, password, first_name, last_name, username, is_verified, role)
      VALUES (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'admin@vibeflo.com',
        '$2b$10$NVyj5bKeOlQwZ19aYnkzWOEaLPIDcB6FOcvMxN0Cj1UuM/FQMq.aG', -- 'password123'
        'Admin',
        'User',
        'admin',
        TRUE,
        'admin'
      );
      
      -- Create a default theme
      INSERT INTO themes (id, name, description, is_default, background_url, is_public, status)
      VALUES (
        '550e8400-e29b-41d4-a716-446655440000',
        'Default Theme', 
        'The default application theme', 
        TRUE, 
        'https://images.unsplash.com/photo-1544511916-0148ccdeb877', 
        TRUE, 
        'approved'
      );
    `);
    console.log('Default data inserted');
    
    return res.status(200).json({ 
      message: 'Database schema has been completely rebuilt successfully'
    });
  } catch (error: any) {
    console.error('Error rebuilding database schema:', error);
    return res.status(500).json({ error: `Error rebuilding database schema: ${error?.message || 'Unknown error'}` });
  }
}; 