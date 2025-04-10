-- Add the username column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- First, make a temporary column not null to avoid conflicts with the unique constraint we'll add later
ALTER TABLE users ALTER COLUMN username DROP NOT NULL;

-- Update existing users with a username derived from their email (but make it unique)
-- This creates usernames based on the part before @ in their emails
UPDATE users
SET username = SUBSTR(email, 1, POSITION('@' IN email) - 1) || id
WHERE username IS NULL;

-- Make the username column required and unique
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);

-- Create an index on username
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Note: After applying this migration, users will need to update their usernames if desired
-- The migration assigns usernames based on email addresses to ensure existing users have valid usernames 