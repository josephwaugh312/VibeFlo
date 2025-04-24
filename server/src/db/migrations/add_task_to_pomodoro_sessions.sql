-- Migration to add task field to pomodoro_sessions table

-- Check if the task column exists, and add it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'pomodoro_sessions'
        AND column_name = 'task'
    ) THEN
        ALTER TABLE pomodoro_sessions ADD COLUMN task TEXT DEFAULT 'Completed Pomodoro';
    END IF;
END$$;

-- Log migration
INSERT INTO migrations (name, applied_at)
VALUES ('add_task_to_pomodoro_sessions', NOW())
ON CONFLICT (name) DO NOTHING; 