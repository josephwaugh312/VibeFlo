#!/bin/bash

# Exit on error
set -e

echo "=== Starting E2E Tests ==="

# Navigate to client directory if not already there
cd "$(dirname "$0")"

# Function to check if server is running
check_server() {
  for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null; then
      echo "✅ Development server is running"
      return 0  # Success
    fi
    echo "⌛ Waiting for development server to start... ($i/30)"
    sleep 2
  done
  echo "❌ Development server startup timed out after 60 seconds"
  return 1  # Failure
}

# Make sure the development server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "Development server not detected. Starting one in the background..."
  
  # Force kill any existing processes on port 3000
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  
  # Start the dev server with more output
  echo "Starting development server..."
  npm start &
  dev_server_pid=$!
  
  echo "Started development server with PID: $dev_server_pid"
  
  # Wait for server to start
  if ! check_server; then
    echo "Error: Failed to start development server after 60 seconds"
    if [ -n "$dev_server_pid" ]; then
      kill $dev_server_pid 2>/dev/null || true
    fi
    exit 1
  fi
  
  echo "Development server started successfully"
else
  echo "Development server already running on port 3000"
  dev_server_pid=""
fi

# Set up trap to clean up on script exit
cleanup() {
  if [ -n "$dev_server_pid" ]; then
    echo "Stopping development server with PID: $dev_server_pid"
    kill $dev_server_pid 2>/dev/null || true
  fi
  echo "=== E2E Tests Complete with exit code: $test_exit_code ==="
}
trap cleanup EXIT

# Run the Cypress tests
echo "Running Cypress tests..."
if [ "$1" = "open" ]; then
  # Run in interactive mode
  npx cypress open
else
  # Run specific tests if provided as arguments
  if [ -n "$2" ]; then
    echo "Running specific tests: $2"
    npx cypress run --spec "$2"
  else
    # Run in headless mode by default
    npx cypress run
  fi
fi

test_exit_code=$?

# Exit with the test exit code
exit $test_exit_code 