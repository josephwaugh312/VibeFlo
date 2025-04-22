-- VibeFlo Database Schema

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

-- Create pomodoro_todos table
CREATE TABLE IF NOT EXISTS pomodoro_todos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  todo_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  recorded_in_stats BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster queries by user_id
CREATE INDEX pomodoro_todos_user_id_idx ON pomodoro_todos (user_id);

-- Create unique constraint on user_id and todo_id to prevent duplicates
CREATE UNIQUE INDEX pomodoro_todos_user_id_todo_id_idx ON pomodoro_todos (user_id, todo_id);

-- Create a function to update the updated_at timestamp for pomodoro_todos
CREATE OR REPLACE FUNCTION update_pomodoro_todos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at timestamp for pomodoro_todos
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'pomodoro_todos_updated_at_trigger') THEN
        CREATE TRIGGER pomodoro_todos_updated_at_trigger
        BEFORE UPDATE ON pomodoro_todos
        FOR EACH ROW
        EXECUTE FUNCTION update_pomodoro_todos_updated_at();
    END IF;
END $$; 