#!/bin/bash
# VibeFlo Render Deployment Script

echo "Starting VibeFlo Render deployment..."

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
cd ..

# Install dependencies and build server
echo "Building server..."
cd server
npm install
npm run build

# Create directory for client build in server dist
echo "Copying client build to server dist directory..."
mkdir -p dist/client
cp -r ../client/build dist/client/

echo "Build completed successfully!" 