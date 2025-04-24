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

# Copy client build to public folder for production
echo "Setting up for production..."
mkdir -p dist/public
cp -r ../client/build/* dist/public/

echo "Deployment build complete!"
echo "To run in production mode, set NODE_ENV=production and start the server"
echo "Example: NODE_ENV=production npm start"

# Return to root directory
cd ..

echo "Done!" 