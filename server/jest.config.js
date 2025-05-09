/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/tests/setupEnv.js'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  moduleNameMapper: {
    // Any module mappings needed
  },
  // Global variables for test environment
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    },
    // Set global variables for tests
    TEST_MODE: true
  },
  // Collect code coverage information
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/tests/**/*'
  ],
  coverageDirectory: 'coverage',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  // Adjusts for slow CI
  testTimeout: 30000
}; 