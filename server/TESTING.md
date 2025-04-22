# VibeFlo Testing Infrastructure

This document outlines the testing infrastructure for the VibeFlo server application, including recent improvements to the testing framework.

## Overview

The VibeFlo server uses Jest as its testing framework. Tests are organized into the following categories:

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test interactions between components
- **Database Tests**: Test database operations with a test database
- **Standalone Tests**: Unit tests that don't require database connections or external services

## Recent Improvements

### 1. Standalone Testing Framework

We've established a standalone testing framework that allows running tests without requiring a database connection:

- Added `test:standalone` script in package.json to run tests that don't require DB
- Created mock implementations for database-dependent code
- Improved test coverage for utility functions and middleware

### 2. Mock Database Adapter

We've implemented a mock database adapter pattern that enables testing database-dependent code without actual database connections:

- Created in-memory database mock (`db-adapter.mock.ts`) that mimics PostgreSQL functionality
- Supports basic SQL operations (SELECT, INSERT, UPDATE, DELETE)
- Ability to seed test data for consistent test results
- Used in controller tests to verify logic without database dependencies

### 3. Middleware Testing

Added comprehensive tests for middleware functions:

- Authentication middleware tests (protect and optionalAuth)
- Admin middleware tests for role-based authorization
- Error handling middleware tests

### 4. Input Sanitization Utilities

Added utilities for input sanitization to prevent security issues:

- HTML sanitization to prevent XSS attacks
- SQL sanitization to help prevent SQL injection
- Object sanitization for nested data structures
- Email validation and sanitization
- Query parameter sanitization

### 5. CI/CD Integration

Integrated testing into the CI/CD pipeline:

- Added GitHub Actions workflow for automated testing
- Tests run on pull requests and pushes to main/develop branches
- Test coverage reports generated and available as artifacts

## Running Tests

### Standalone Tests

Run tests that don't require database connections:

```bash
npm run test:standalone
```

To see console output during tests (for debugging):

```bash
DEBUG=true npm run test:standalone
```

### All Tests

Run all tests (requires database connection):

```bash
npm test
```

### Coverage Reports

Generate coverage reports:

```bash
npm run test:standalone -- --coverage
```

Coverage reports are available in the `coverage` directory.

## Writing New Tests

### Unit Test Example

```typescript
import { yourFunction } from '../../utils/your-utils';

describe('Your Utility', () => {
  it('should perform the expected operation', () => {
    const result = yourFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Using the Mock Database

```typescript
import { createMockPool, clearMockData, seedMockData } from '../mocks/db-adapter.mock';

// Mock the database pool
jest.mock('../../config/db', () => {
  const { createMockPool } = require('../mocks/db-adapter.mock');
  return createMockPool();
});

describe('Your Controller', () => {
  beforeEach(() => {
    // Clear previous test data
    clearMockData();
    
    // Seed test data
    seedMockData('users', [
      { id: 1, name: 'Test User', email: 'test@example.com' }
    ]);
  });
  
  it('should retrieve data from the mock database', async () => {
    // Test your controller function
  });
});
```

## Best Practices

1. **Use Appropriate Test Types**: Use unit tests for isolated functions, integration tests for interactions between components, and database tests for database operations.

2. **Mock External Dependencies**: Always mock external dependencies like databases, APIs, and file systems.

3. **Test Error Cases**: Test both success and error cases to ensure proper error handling.

4. **Keep Tests Independent**: Each test should be independent and not rely on the state from previous tests.

5. **Use Descriptive Test Names**: Test names should describe what the test is checking.

6. **Avoid Console Output**: Use the setup file's console mocking to keep test output clean.

7. **Follow AAA Pattern**: Arrange, Act, Assert - set up the test, perform the action, and verify the results.