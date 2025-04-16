# VibeFlo Testing Guide

This guide outlines the testing approach, utilities, and best practices for both server and client-side testing in the VibeFlo application.

## Table of Contents

1. [Server-Side Testing](#server-side-testing)
   - [Unit Tests](#unit-tests)
   - [Integration Tests](#integration-tests)
   - [Test Utilities](#test-utilities)
   - [Mocking Database](#mocking-database)
   - [Test Data Factories](#test-data-factories)

2. [Client-Side Testing](#client-side-testing)
   - [Component Tests](#component-tests)
   - [Service Tests](#service-tests)
   - [Utility Tests](#utility-tests)
   - [Responsive Tests](#responsive-tests)
   - [Test Utilities](#client-test-utilities)

3. [Test Commands](#test-commands)
   - [Server Commands](#server-commands)
   - [Client Commands](#client-commands)

4. [Best Practices](#best-practices)
   - [Server Testing](#server-testing-best-practices)
   - [Client Testing](#client-testing-best-practices)

---

## Server-Side Testing

### Unit Tests

Unit tests focus on testing individual functions, utilities, and services in isolation. These tests are located in `server/src/tests/unit/`.

Each test file follows the naming pattern `*.test.ts` and focuses on a specific module or functionality:

- `validation.test.ts` - Tests for validation utility functions
- `jwt.test.ts` - Tests for JWT generation and verification
- `errorHandler.test.ts` - Tests for error handling middleware
- `email.test.ts` - Tests for email service functions

### Integration Tests

Integration tests verify that different parts of the system work together correctly. These tests are located in `server/src/tests/integration/`.

API tests check the entire request-response cycle, including:
- Route handling
- Controller logic
- Database interactions (mocked)
- Response formatting

Example: `auth.api.test.ts` tests authentication endpoints like registration and login.

### Test Utilities

The server tests use several utilities located in:
- `server/src/tests/setupApiTests.ts` - Common setup for API tests
- `server/src/tests/utils/testFactories.ts` - Factory functions for test data
- `server/src/config/testDb.ts` - Test database configuration

### Mocking Database

Database operations are mocked to avoid test dependencies on a real database:

```typescript
// Using the setupDbMock utility
setupDbMock(pool, {
  'SELECT * FROM users': {
    rows: [createTestUser()],
    rowCount: 1
  }
});

// Or using more targeted query matching
(pool.query as jest.Mock).mockImplementation((query) => {
  if (query.includes('SELECT * FROM users WHERE id')) {
    return Promise.resolve({
      rows: [createTestUser()],
      rowCount: 1
    });
  }
  // Default response
  return Promise.resolve({ rows: [], rowCount: 0 });
});
```

### Test Data Factories

Factory functions create consistent test data across test files:

```typescript
import { createTestUser, createTestPlaylist } from '../utils/testFactories';

// Create a test user
const user = createTestUser({ id: 2, name: 'Custom Name' });

// Create a test playlist
const playlist = createTestPlaylist({ user_id: user.id });
```

---

## Client-Side Testing

### Component Tests

Component tests verify UI rendering and interactions. Located in `client/src/__tests__/components/`.

Tests focus on:
- Correct rendering of UI elements
- User interactions (clicks, form inputs)
- Component state changes
- Proper integration with context providers

Example: `TodoList.test.tsx` tests the todo list component's rendering and interaction.

### Service Tests

Service tests verify API client functions and external service integrations. Located in `client/src/__tests__/services/`.

These tests focus on:
- API client methods
- Spotify integration
- Authentication flows
- Data transformation

Example: `spotify.test.ts` tests Spotify API integration functions.

### Utility Tests

Utility tests verify helper functions used throughout the application. Located in `client/src/__tests__/utils/`.

Example: `dateUtils.test.ts` tests date formatting and calculation functions.

### Responsive Tests

Responsive tests verify that components render correctly at different screen sizes. Located in `client/src/__tests__/responsive/`.

These tests use special utilities to simulate different viewport sizes.

### Client Test Utilities

The client tests use several utilities located in:
- `client/src/__tests__/utils/test-utils.tsx` - Custom render functions with providers
- `client/src/__tests__/mocks/` - Mock implementations of external dependencies

Example of using the custom render function:

```typescript
import { render, screen, fireEvent } from '../utils/test-utils';
import TodoList from '../../components/TodoList';

test('should render todo items', () => {
  render(<TodoList todos={mockTodos} />);
  expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
});
```

---

## Test Commands

### Server Commands

```bash
# Run all server tests
cd server && npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage report
npm run test:coverage

# Run basic tests (guaranteed to pass)
npm run test:basic

# Run standalone tests (core utilities)
npm run test:standalone

# Run API tests
npm run test:api
```

### Client Commands

```bash
# Run all client tests
cd client && npm test

# Run component tests only
npm run test:components

# Run responsive tests only
npm run test:responsive

# Run tests with coverage report
npm run test:coverage

# Run tests for CI (non-interactive)
npm run test:ci
```

---

## Best Practices

### Server Testing Best Practices

1. **Mock External Dependencies**: Always mock database connections, email services, etc.
2. **Use Factory Functions**: Use test factories for consistent test data
3. **Test Error Cases**: Include tests for error conditions and edge cases
4. **Clean Mocks Between Tests**: Use `beforeEach` to reset mocks between tests
5. **Descriptive Test Names**: Use descriptive test names that explain what is being tested

### Client Testing Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it's implemented
2. **Use Test Utilities**: Use the custom render functions with appropriate providers
3. **Mock API Calls**: Mock API calls using Jest mocks
4. **Test User Interactions**: Test clicks, form inputs, and other user interactions
5. **Snapshot Testing**: Use snapshot testing sparingly, only for stable components

By following these guidelines, you'll maintain a robust test suite that helps ensure the quality and reliability of the VibeFlo application. 