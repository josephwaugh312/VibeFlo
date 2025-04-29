-- Migration to add task field to pomodoro_sessions table

-- Check if the task column exists, and add it if it doesn't
DO 74930
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'pomodoro_sessions'
        AND column_name = 'task'
    ) THEN
        ALTER TABLE pomodoro_sessions ADD COLUMN task TEXT DEFAULT 'Completed Pomodoro';
    END IF;
END74930;

-- Log migration
CREATE TABLE IF NOT EXISTS migrations (
  name VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO migrations (name, applied_at)
VALUES ('add_task_to_pomodoro_sessions', NOW())
ON CONFLICT (name) DO NOTHING;
