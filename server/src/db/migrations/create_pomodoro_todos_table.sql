-- Create the pomodoro_todos table to store todo items

-- Check if the table already exists, create it if it doesn't
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

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_pomodoro_todos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at timestamp
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'pomodoro_todos_updated_at_trigger') THEN
        CREATE TRIGGER pomodoro_todos_updated_at_trigger
        BEFORE UPDATE ON pomodoro_todos
        FOR EACH ROW
        EXECUTE FUNCTION update_pomodoro_todos_updated_at();
    END IF;
END $$; 