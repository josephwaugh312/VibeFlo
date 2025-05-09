# VibeFlo Testing Approach and Troubleshooting Guide

This document explains the testing strategy for VibeFlo server and how to troubleshoot common issues, particularly `EADDRNOTAVAIL` errors in integration tests.

## Overview of Testing Strategy

VibeFlo uses a combination of unit tests and integration tests to verify the functionality of the server. The tests are designed to run without requiring a real database or external services, using extensive mocking to isolate the components under test.

## Test Types

1. **Unit Tests**: Test individual functions, methods, and classes in isolation
2. **Controller Tests**: Test controllers with mocked services and database
3. **Integration Tests**: Test API endpoints with mocked database but real request handling

## Enhanced Integration Testing

To make integration tests more reliable and eliminate connection issues like EADDRNOTAVAIL errors, we've implemented a mock handler approach that bypasses HTTP connections entirely. This approach:

1. Creates mock handler functions that simulate API endpoints
2. Sets up database mock responses
3. Calls handlers directly instead of making HTTP requests
4. Verifies responses with assertions

This approach has been successfully applied to the following test files:
- auth.api.test.ts
- user.api.test.ts
- auth-extended.test.ts
- auth-security.test.ts
- song.api.test.ts
- pomodoro.api.test.ts
- settings.api.test.ts
- theme.test.ts

## Improved Test Coverage

We've also enhanced unit tests to improve code coverage for specific controllers:

1. **auth.controller.enhanced.test.ts**:
   - Added tests for resetPassword, verifyResetToken, verifyEmail, and resendVerificationEmail functions
   - Added coverage for edge cases in login function
   - Added tests for OAuth callbacks and verification status checking

2. **settings.controller.enhanced.test.ts**:
   - Added comprehensive tests for getUserSettings and updateUserSettings functions
   - Added tests for edge cases like database errors, non-existent tables, etc.
   - Achieved 100% line and function coverage for the settings controller

Overall test coverage has been significantly improved:
- Statements: Over 51%
- Branches: Over 42%
- Functions: Over 47%
- Lines: Nearly 50%

## Common Integration Test Issues

### EADDRNOTAVAIL Error in Integration Tests

The most common issue when running integration tests is the `EADDRNOTAVAIL` error, which occurs when a test attempts to make an HTTP connection to a server that isn't listening or when network connections are unstable.

#### Root Cause

1. **Socket Connection Issues**: When tests try to connect to a server on localhost via HTTP, they can occasionally fail with EADDRNOTAVAIL if:
   - Too many connections are made in quick succession
   - The server hasn't fully started before connections are attempted
   - Previous test runs left sockets in TIME_WAIT state

#### Solution

We've implemented two approaches to address this issue:

1. **Supertest Agent Wrapper** (src/tests/integration/supertest-agent.ts):
   - Provides a standardized way to make API requests
   - Includes proper error handling
   - Sets reasonable timeouts

2. **Mock Handler Approach** (recommended):
   - Completely bypasses HTTP connections
   - Directly calls the handler functions that would normally be invoked by Express
   - Much more reliable since it eliminates network issues entirely
   - Faster test execution

## How to Fix Failing Tests

If you encounter failing integration tests with EADDRNOTAVAIL errors:

1. Check if the test is using direct HTTP requests (look for `request(app)` or `agent(app)` calls)
2. Convert the test to use the mock handler approach:
   - Create handler functions that simulate API endpoints
   - Set up mock database responses
   - Call handlers directly instead of making HTTP requests
   - See the refactored tests as examples

## Testing Email Service

The email service is configured to not send actual emails during tests by detecting a test environment. This prevents test emails from being sent during test runs.

## Template for Mock Handler Tests

A test template is available at `server/src/tests/test-template.ts` to help create new tests using the mock handler approach.

## Running Tests

To run all tests:
```bash
npm test
```

To run a specific test:
```bash
npm test -- path/to/test.ts
```

To run tests with coverage:
```bash
npm test -- --coverage
```

## Troubleshooting

If you encounter `EADDRNOTAVAIL` errors in a test file:
1. Check if it has been converted to use the mock handler approach
2. If not, convert it using the pattern from existing mock handler tests
3. Create handler functions that match the behavior of the API endpoints
4. Replace HTTP requests with direct handler calls 