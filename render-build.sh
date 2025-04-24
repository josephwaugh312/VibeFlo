#!/bin/bash
# VibeFlo Render Deployment Script

echo "Starting VibeFlo Render deployment..."

# Install dependencies and build client
echo "Building React client..."
cd client
npm install
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