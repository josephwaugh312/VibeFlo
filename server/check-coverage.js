const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define controllers to check
const controllers = [
  'auth.controller.ts',
  'user.controller.ts',
  'theme.controller.ts',
  'theme-moderation.controller.ts',
  'playlist.controller.ts',
  'song.controller.ts',
  'settings.controller.ts',
  'spotifyController.ts'
];

// Get the list of test files related to each controller
const controllerTests = {};
controllers.forEach(controller => {
  const baseName = controller.replace('.ts', '');
  const testGlob = `src/tests/{unit,integration}/*${baseName}*`;
  controllerTests[controller] = testGlob;
});

// Function to run jest for a specific controller
function getControllerCoverage(controller) {
  try {
    const command = `npx jest --coverage --collectCoverageFrom="src/controllers/${controller}" --json ${controllerTests[controller] || ''}`;
    const output = execSync(command, { encoding: 'utf8' });
    
    // Parse JSON output
    const result = JSON.parse(output);
    
    // Find the coverage for the specific controller file
    const coverageKey = Object.keys(result.coverageMap).find(key => 
      key.includes(`/src/controllers/${controller}`)
    );
    
    if (coverageKey) {
      const coverage = result.coverageMap[coverageKey].statementMap;
      const totalStatements = Object.keys(coverage).length;
      const coveredStatements = result.coverageMap[coverageKey].s;
      
      // Count covered statements
      let covered = 0;
      Object.keys(coveredStatements).forEach(key => {
        if (coveredStatements[key] > 0) {
          covered++;
        }
      });
      
      return {
        statements: totalStatements > 0 ? (covered / totalStatements) * 100 : 0,
        total: totalStatements
      };
    }
    
    return { statements: 0, total: 0 };
  } catch (error) {
    console.error(`Error checking coverage for ${controller}:`, error.message);
    return { statements: 0, total: 0 };
  }
}

// Print header
console.log('Controller Coverage Summary');
console.log('==========================');
console.log('Controller                | % Statements | Total Statements');
console.log('--------------------------|--------------|------------------');

// Check each controller
controllers.forEach(controller => {
  const coverage = getControllerCoverage(controller);
  const percent = coverage.statements.toFixed(2);
  console.log(`${controller.padEnd(26)} | ${percent.padEnd(12)}% | ${coverage.total}`);
});

console.log('=========================='); 