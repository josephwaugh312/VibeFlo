-- Create failed_login_attempts table
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id SERIAL PRIMARY KEY,
    login_identifier VARCHAR(255) NOT NULL,  -- Can be email or username
    ip_address VARCHAR(45) NOT NULL,         -- IPv6 addresses can be up to 45 chars
    attempt_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_attempt UNIQUE (login_identifier, ip_address, attempt_time)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_failed_attempts_time ON failed_login_attempts(attempt_time);
CREATE INDEX IF NOT EXISTS idx_failed_attempts_identifier ON failed_login_attempts(login_identifier); 