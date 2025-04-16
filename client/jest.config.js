module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!axios|react-youtube)'
  ],
  moduleNameMapper: {
    '^react-router-dom$': '<rootDir>/src/__tests__/mocks/react-router-dom.tsx',
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__tests__/mocks/styleMock.js'
  }
}; 