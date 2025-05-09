#!/bin/bash

# Update all integration test files to use testServer instead of app

FILES=$(grep -l "import { app } from '../../app';" src/tests/integration/*.ts | grep -v setupServer.ts)

for file in $FILES; do
  echo "Updating $file"
  
  # Replace the app import with testServer import
  sed -i '' "s/import { app } from '\.\.\/\.\.\/app';/import { testServer } from '.\/setupServer';/g" "$file"
  
  # Replace app with testServer in the rest of the file
  sed -i '' "s/request(app)/request(testServer)/g" "$file"
done

echo "All files updated!" 