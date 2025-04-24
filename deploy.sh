#!/bin/bash
# VibeFlo Deployment Script

echo "Starting VibeFlo deployment..."

# Navigate to client directory
echo "Building React client..."
cd client
npm install
npm run build

# Navigate back to root and then to server directory
echo "Building server..."
cd ../server
npm install
npm run build

# Copy client build to server public directory for Render deployment
echo "Copying client build to server for Render deployment..."
mkdir -p dist/client
cp -r ../client/build dist/client/

echo "Deployment build complete!"
echo "To run in production mode:"
echo "1. Set NODE_ENV=production"
echo "2. Start the server with: npm start"
echo "Example: NODE_ENV=production npm start"

# Return to root directory
cd ..

echo "Done!" 