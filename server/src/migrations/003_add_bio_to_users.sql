-- Add bio column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add github_id column if it doesn't exist already
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id VARCHAR(255);

-- Add is_verified column if it doesn't exist already
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Rename profile_picture column to avatar_url if needed
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'profile_picture'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE users RENAME COLUMN profile_picture TO avatar_url;
    END IF;
END $$; 