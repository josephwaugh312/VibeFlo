-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  profile_picture VARCHAR(255),
  google_id VARCHAR(255),
  facebook_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create pomodoro_sessions table
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL, -- Duration in minutes
  task VARCHAR(255),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  pomodoro_duration INTEGER DEFAULT 25, -- Default pomodoro duration in minutes
  short_break_duration INTEGER DEFAULT 5, -- Default short break duration in minutes
  long_break_duration INTEGER DEFAULT 15, -- Default long break duration in minutes
  pomodoros_until_long_break INTEGER DEFAULT 4, -- Number of pomodoros until a long break
  auto_start_breaks BOOLEAN DEFAULT TRUE,
  auto_start_pomodoros BOOLEAN DEFAULT TRUE,
  dark_mode BOOLEAN DEFAULT FALSE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  notification_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add some indexes for performance
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_facebook_id ON users(facebook_id);

-- Create songs table 
CREATE TABLE IF NOT EXISTS songs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  album VARCHAR(255),
  duration INTEGER, -- Duration in seconds
  image_url VARCHAR(512),
  url VARCHAR(512), -- URL for the song (e.g., YouTube URL)
  youtube_id VARCHAR(30), -- YouTube video ID for YouTube links
  source VARCHAR(50), -- Source of the song (e.g., 'youtube')
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create playlist_songs join table
CREATE TABLE IF NOT EXISTS playlist_songs (
  playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
  song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (playlist_id, song_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist_id ON playlist_songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_song_id ON playlist_songs(song_id);

-- Create the pomodoro_todos table to store todo items
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pomodoro_todos') THEN
        CREATE TABLE pomodoro_todos (
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
    END IF;
END $$;

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