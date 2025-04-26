#!/bin/bash
# VibeFlo Render Deployment Script

echo "Starting VibeFlo Render deployment..."

# Detect if this is a client-only build based on environment variable
IS_CLIENT_ONLY=${IS_CLIENT_ONLY:-false}
echo "Build type: ${IS_CLIENT_ONLY}"

# Install dependencies and build client with specific dependency adjustments
echo "Building React client..."
cd client

# Remove node_modules and package-lock.json for a clean install
rm -rf node_modules package-lock.json

# Create and run script to fix dependencies
echo "Fixing React dependencies..."
echo "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('package.json')); delete pkg.dependencies['react-beautiful-dnd']; delete pkg.dependencies['@types/react-beautiful-dnd']; pkg.dependencies['react'] = '^18.2.0'; pkg.dependencies['react-dom'] = '^18.2.0'; pkg.dependencies['@types/react'] = '^18.2.0'; pkg.dependencies['@types/react-dom'] = '^18.2.0'; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));" > fix-deps.js
node fix-deps.js

# Install dependencies with specific flags and additional packages
npm install --legacy-peer-deps
npm install ajv@^6.12.6 ajv-keywords@^3.5.2

# Build the client
npm run build

# Verify client build was created
if [ ! -f "build/index.html" ]; then
  echo "ERROR: Client build failed - index.html not found!"
  ls -la build/
  exit 1
fi

echo "Client build successfully created"
cd ..

# For client-only build, we're done
if [ "$IS_CLIENT_ONLY" = "true" ]; then
  echo "Client-only build completed. Skipping server and database operations."
  exit 0
fi

# Install dependencies and build server
echo "Building server..."
cd server
npm install
npm run build

# Create directory for client build in server dist
echo "Copying client build to server dist directory..."
mkdir -p dist/client
cp -r ../client/build dist/client/

# Verify the copy worked
if [ ! -f "dist/client/build/index.html" ]; then
  echo "ERROR: Client build files not properly copied!"
  ls -la dist/client/
  ls -la dist/client/build/ 2>/dev/null || echo "build directory doesn't exist"
  exit 1
fi

echo "Client build files successfully copied to server/dist/client/build"

# Function to run database operation with error handling
run_db_operation() {
  local operation_name=$1
  local command=$2
  
  echo "Running $operation_name..."
  
  # Retry logic with 3 attempts
  for i in {1..3}; do
    echo "Attempt $i for $operation_name"
    NODE_ENV=production npx $command
    
    if [ $? -eq 0 ]; then
      echo "$operation_name completed successfully"
      return 0
    else
      echo "$operation_name failed on attempt $i"
      if [ $i -lt 3 ]; then
        echo "Waiting 5 seconds before retry..."
        sleep 5
      fi
    fi
  done
  
  echo "WARNING: $operation_name failed after 3 attempts, but continuing deployment"
  return 1
}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL is not set. Skipping database operations."
else
  # Run database migrations and fixes with error handling
  run_db_operation "fix for themes table columns" "ts-node src/db/fix-themes-columns.ts"
  run_db_operation "database migrations" "ts-node src/db/run-theme-migrations.ts"
  run_db_operation "fix for themes image_url column" "ts-node src/db/fix-themes-image-url.ts"
  run_db_operation "fix for custom_themes table" "ts-node src/db/fix-custom-themes.ts"
  run_db_operation "fix for OAuth columns" "ts-node src/db/fix-oauth-columns.ts"
  run_db_operation "standard themes population" "ts-node src/db/populate-standard-themes.ts"
  run_db_operation "cleanup invalid themes" "ts-node src/db/cleanup-invalid-themes.ts"
fi

# Print directory structure for debugging
echo "Final directory structure:"
find dist -type f | sort

echo "Build completed successfully!" 