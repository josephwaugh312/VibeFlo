#!/bin/bash

# Exit on any error
set -e

echo "Installing dependencies with legacy-peer-deps..."
npm install --legacy-peer-deps

echo "Building the React application..."
npm run build

echo "Build completed successfully!" 