# VibeFlo Testing Guide

This document outlines the testing approach for the VibeFlo application, covering both server and client-side testing.

## Server-Side Testing

### Test Structure

- **Unit Tests**: Located in `server/src/tests/unit/`
- **Integration Tests**: Located in `server/src/tests/integration/`
- **Test Environment**: Configuration in `.env.test` file

### Running Server Tests

```bash
# Navigate to server directory
cd server

# Run all tests
npm test

# Run basic tests only (these are guaranteed to pass)
npx jest src/tests/unit/basic.test.ts

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Current Status

The server tests are currently in a maintenance state. There are several issues that need to be addressed:

1. Some service files referenced in tests are missing or have implementation differences
2. The database layer appears to have changed from using raw SQL queries to Knex.js
3. Integration tests are failing due to API endpoint changes

To run the basic sanity test that confirms the test infrastructure is working:

```bash
npx jest src/tests/unit/basic.test.ts
```

### Test Strategy

1. **Unit Tests**: Focus on testing individual services and utilities without dependencies
   - Auth service
   - Theme service
   - User service
   - Email service

2. **Integration Tests**: Test API endpoints with mocked database
   - Authentication endpoints
   - User endpoints
   - Theme endpoints
   - Playlist endpoints

## Client-Side Testing

### Test Structure

- **Component Tests**: Located in `client/src/__tests__/components/`
- **Service Tests**: Located in `client/src/__tests__/services/`
- **Responsive Design Tests**: Located in `client/src/__tests__/responsive/`
- **Utility Tests**: Located in `client/src/__tests__/utils/`

### Running Client Tests

```bash
# Navigate to client directory
cd client

# Run all tests
npm test

# Run the basic component test (guaranteed to pass)
npm test -- --testMatch="**/__tests__/components/Basic.test.tsx"

# Run specific test files
npm test -- src/__tests__/components/AddTodoInput.test.tsx
npm test -- src/__tests__/services/apiToken.test.ts
npm test -- src/__tests__/utils/generateId.test.ts

# Run component tests only
npm run test:components

# Run responsive design tests only
npm run test:responsive

# Run tests with coverage report
npm run test:coverage

# Run tests for CI (non-interactive)
npm run test:ci
```

### Current Status

The client tests work best when run using the React Scripts test command (`npm test`), which provides the proper configuration for handling JSX and TypeScript.

Recently added tests:
1. **API Service**: Token management tests (in `src/__tests__/services/apiToken.test.ts`)
2. **Pomodoro Components**: Tests for the AddTodoInput component (in `src/__tests__/components/AddTodoInput.test.tsx`)
3. **Utility Tests**: Tests for the generateId utility (in `src/__tests__/utils/generateId.test.ts`)

There may be issues with some of the more complex tests due to:
1. Dependencies on external components that need mocking
2. Outdated component references
3. Changes to component props or structure

To run a simple test that confirms the React testing infrastructure is working:

```bash
npm test -- --testMatch="**/__tests__/components/Basic.test.tsx"
```

### Test Strategy

1. **Component Tests**: Test individual React components
   - MusicPlayer
   - TodoList components (Todo, AddTodoInput)
   - Navbar
   - Profile components

2. **Service Tests**: Test services that interact with external APIs
   - API service (token management, error handling)
   - Auth service
   - Settings service

3. **Utility Tests**: Test utility functions
   - generateId
   - Date formatting
   - String manipulation

4. **Responsive Design Tests**: Test components at different viewport sizes
   - Mobile (375px width)
   - Tablet (768px width)
   - Desktop (1024px width and above)

## Fixing Test Issues

### Server Tests

To fix the server tests, follow these steps:

1. **Update Service Files**:
   - Ensure all required service files exist in `server/src/services/`
   - Update the implementation to match what's expected in tests

2. **Update Database Layer**:
   - Update tests to use Knex.js instead of raw SQL queries
   - Ensure mock implementations use the correct interface

3. **Fix API Endpoint Tests**:
   - Update the expected API responses to match current implementation
   - Verify route handlers match what's expected in tests

### Client Tests

To fix the client tests, follow these steps:

1. **Update Dependencies**:
   - Ensure all required dependencies are installed (`@testing-library/react`, etc.)
   - Check for version conflicts with React and related libraries

2. **Mock External Components**:
   - Create proper mocks for external dependencies (like YouTube player)
   - Update context providers to provide expected values

3. **Update Component References**:
   - Ensure test files import the correct component versions
   - Update tests to match current component structure

## Common Issues and Solutions

- **Database Connection Issues**: Make sure test database is created and configured in `.env.test`
- **React Testing Issues**: Check that all required context providers are properly mocked
- **Jest Configuration Issues**: Ensure Jest is properly configured to handle TypeScript and JSX

## Testing Best Practices

1. **Write Tests First**: Adopt a TDD (Test-Driven Development) approach for new features
2. **Keep Tests Independent**: Each test should be able to run independently of others
3. **Test The Interface**: Focus on testing inputs and outputs, not implementation details
4. **Use Meaningful Assertions**: Make assertions that validate the expected behavior
5. **Test Edge Cases**: Include tests for boundary conditions and error handling

## Creating New Tests

### Server-Side
```typescript
// Example unit test structure
describe('Service Name', () => {
  beforeEach(() => {
    // Setup code
  });
  
  describe('Function Name', () => {
    it('should do something specific', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Client-Side
```typescript
// Example component test structure
describe('Component Name', () => {
  it('renders correctly', () => {
    render(<Component {...props} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('handles user interaction', () => {
    render(<Component {...props} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockFunction).toHaveBeenCalled();
  });
});
```

## Continuous Integration

- All tests are automatically run on pull requests
- Tests must pass before merging into the main branch
- Code coverage reports are generated for each build 