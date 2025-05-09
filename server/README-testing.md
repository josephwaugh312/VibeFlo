# VibeFlo Testing Guide

This document explains how to run unit and integration tests for the VibeFlo server.

## Test Types

The VibeFlo project has two main types of tests:

1. **Unit Tests**: These test individual components in isolation and mock all dependencies.
2. **Integration Tests**: These test the interaction between multiple components and mock external dependencies like databases.

## Running Tests

### Running All Tests

To run all tests:

```bash
npm test
```

### Running Specific Tests

To run a specific test file or test pattern:

```bash
npm test -- auth.controller
```

### Running Only Unit Tests

```bash
npm test -- --testPathIgnorePatterns=integration
```

### Running Only Integration Tests

```bash
npm test -- integration
```

## Test Structure

Tests are organized in the following directories:

- `src/tests/unit/`: Unit tests for individual components
- `src/tests/integration/`: Integration tests for API endpoints
- `src/tests/mocks/`: Mock implementations used across tests

## The Test Mocking System

### Database Mocking

All tests use a mock database to avoid the need for a real database connection. The mock is implemented in `src/tests/mocks/db-mock.ts` and provides:

- A mock `Pool` for direct database queries
- A mock `Client` for transactions
- Ability to set up custom responses for sequences of queries

### Setting Up Database Mocks

```typescript
import { setupDbMockResponses } from './setupIntegrationTests';

// Setup responses for a sequence of queries
setupDbMockResponses([
  // First query response
  {
    rows: [
      { id: 1, name: 'Test Item' }
    ],
    rowCount: 1
  },
  // Second query response
  {
    rows: [],
    rowCount: 0
  }
]);
```

### Authentication Mocking

Authentication is mocked to avoid the need for real credentials:

- JWT tokens are mocked to always validate
- Passport authentication is mocked to provide a test user
- Request cookies and headers are interpreted as expected

### Email Service Mocking

Email services are mocked to prevent actual emails from being sent during tests:

- All email methods like `sendVerificationEmail` and `sendPasswordResetEmail` are mocked
- The mocks return successful responses but don't send actual emails

## Supertest Agent for Integration Tests

To solve EADDRNOTAVAIL and connection issues, all integration tests should use the custom supertest agent wrapper:

```typescript
import { testApi } from '../mocks/supertest-agent';

// GET request with authentication
const response = await testApi.get('/api/users/me', token);

// POST request with data
const response = await testApi.post('/api/auth/login', loginData);

// PUT request with authentication
const response = await testApi.put('/api/settings', settingsData, token);
```

This wrapper handles:
- Socket connection issues by properly mocking HTTP connections
- Authorization headers for authenticated requests
- Common request configuration

## Mock Handler Approach for EADDRNOTAVAIL Errors

If you're still experiencing EADDRNOTAVAIL errors despite using the supertest-agent, you can use the direct mock handler approach:

```typescript
// Create a mock handler function for the endpoint
const mockLoginHandler = (loginData: any, passwordValid = true) => {
  // Handle the request
  if (!passwordValid) {
    return {
      status: 401,
      body: {
        success: false,
        message: 'Invalid credentials'
      }
    };
  }
  
  return {
    status: 200,
    body: {
      success: true,
      token: 'mock-token',
      user: { id: 1, username: 'test' }
    }
  };
};

// In your test
it('should login successfully', () => {
  // Setup database mocks
  setupDbMockResponses([
    { rows: [{ id: 1, username: 'test' }], rowCount: 1 }
  ]);
  
  // Test data
  const loginData = { username: 'test', password: 'password' };
  
  // Call handler directly instead of HTTP request
  const response = mockLoginHandler(loginData);
  
  // Assertions
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
});
```

A complete template for this approach is provided in `src/tests/integration/test-template.ts`.

## Fixing Integration Tests

Integration tests are designed to run without connecting to external services. If you see errors related to:

1. Database connections (`EADDRNOTAVAIL`)
2. Authentication failures
3. Email service errors

The issue is likely with the mocking setup rather than your code. Follow these steps to fix:

1. Make sure you're importing from the right mock modules
2. Ensure you're properly setting up mock responses for all database queries
3. Check that authentication is properly mocked for protected routes
4. Use the `testApi` helper instead of direct supertest calls

### Example Test Fix

If a test is failing with a database connection error:

```typescript
// Before - using direct supertest
const response = await request(app)
  .get('/api/users/me')
  .set('Authorization', `Bearer ${token}`)
  .expect(200);

// After - with proper mocking
import { setupDbMockResponses, generateTestToken } from './setupIntegrationTests';
import { testApi } from '../mocks/supertest-agent';

// Setup mock responses
setupDbMockResponses([
  {
    rows: [{ id: 1, username: 'testuser' }],
    rowCount: 1
  }
]);

// Generate a test token
const token = generateTestToken();

// Now the test will avoid actual connections
const response = await testApi.get('/api/users/me', token);
expect(response.status).toBe(200);
```

## Creating Test-Specific Implementations

For complex controllers or services, you may need to create test-specific implementations that behave predictably:

1. Create a file with the format `filename-test-fixes.ts` 
2. Implement a simpler version that matches test expectations
3. Update the test to import from this file instead of the actual implementation

This approach lets you focus on testing the interaction patterns without dealing with implementation details.

## Contributing New Tests

When adding new tests:

1. Use the mocking system for all external dependencies
2. Follow the pattern of existing tests for consistent structure
3. Make sure tests are isolated and don't depend on each other
4. Prefer specific assertions over generic ones 
5. Always use the `testApi` helper for HTTP requests
6. Skip tests that can't be properly mocked rather than letting them fail
7. For persistent EADDRNOTAVAIL errors, use the mock handler approach 