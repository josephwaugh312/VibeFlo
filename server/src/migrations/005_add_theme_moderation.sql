-- Add theme moderation fields
ALTER TABLE IF EXISTS themes
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS moderation_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS moderation_notes TEXT,
  ADD COLUMN IF NOT EXISTS reported_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reported_at TIMESTAMP;

-- Create a new table for theme reports
CREATE TABLE IF NOT EXISTS theme_reports (
  id SERIAL PRIMARY KEY,
  theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(theme_id, user_id) -- Prevent duplicate reports from the same user
);

-- Add admin flag to users table
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
