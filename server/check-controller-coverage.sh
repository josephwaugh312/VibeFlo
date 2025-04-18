#!/bin/bash

# Array of controllers to check
CONTROLLERS=(
  "auth.controller.ts"
  "user.controller.ts"
  "theme.controller.ts"
  "theme-moderation.controller.ts"
  "playlist.controller.ts"
  "song.controller.ts"
  "settings.controller.ts"
  "spotifyController.ts"
)

# Print header
echo "Controller Coverage Summary"
echo "=========================="
echo "Controller | % Stmts | % Branch | % Funcs | % Lines"
echo "----------|---------|----------|---------|--------"

# Loop through each controller and check coverage
for controller in "${CONTROLLERS[@]}"; do
  # Run Jest with coverage for this controller
  coverage_output=$(npx jest --coverage --collectCoverageFrom="src/controllers/${controller}" --silent)
  
  # Extract coverage data using grep and awk
  stmts=$(echo "$coverage_output" | grep -A 4 "All files" | grep "${controller}" | awk '{print $2}')
  branch=$(echo "$coverage_output" | grep -A 4 "All files" | grep "${controller}" | awk '{print $3}')
  funcs=$(echo "$coverage_output" | grep -A 4 "All files" | grep "${controller}" | awk '{print $4}')
  lines=$(echo "$coverage_output" | grep -A 4 "All files" | grep "${controller}" | awk '{print $5}')
  
  # If no coverage data found, set to 0%
  if [ -z "$stmts" ]; then
    stmts="0%"
    branch="0%"
    funcs="0%"
    lines="0%"
  fi
  
  # Print results
  printf "%-10s | %-7s | %-8s | %-7s | %-7s\n" "${controller}" "${stmts}" "${branch}" "${funcs}" "${lines}"
done

echo "==========================" 