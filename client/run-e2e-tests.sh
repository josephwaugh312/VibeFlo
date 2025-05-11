#!/bin/bash

# Run the Cypress E2E tests
echo "Running VibeFlo E2E tests..."

# Start the development server in the background (if not already running)
if ! nc -z localhost 3000 &>/dev/null; then
  echo "Starting frontend development server..."
  npm start &
  FRONTEND_PID=$!
  # Wait for frontend to start
  echo "Waiting for frontend to start..."
  while ! nc -z localhost 3000 &>/dev/null; do
    sleep 1
  done
  echo "Frontend is up and running on port 3000"
fi

# Start the backend server in a different terminal if not already running
if ! nc -z localhost 5001 &>/dev/null; then
  echo "Starting backend development server..."
  cd ../server && npm run dev &
  BACKEND_PID=$!
  # Wait for backend to start
  echo "Waiting for backend to start..."
  while ! nc -z localhost 5001 &>/dev/null; do
    sleep 1
  done
  echo "Backend is up and running on port 5001"
fi

# Run Cypress tests
echo "Starting Cypress tests..."
npm run cypress:run

# Capture the exit code of Cypress tests
CYPRESS_EXIT_CODE=$?

# Kill the servers if we started them
if [ -n "$FRONTEND_PID" ]; then
  echo "Shutting down frontend server..."
  kill $FRONTEND_PID
fi

if [ -n "$BACKEND_PID" ]; then
  echo "Shutting down backend server..."
  kill $BACKEND_PID
fi

echo "All E2E tests completed with exit code: $CYPRESS_EXIT_CODE"
exit $CYPRESS_EXIT_CODE 