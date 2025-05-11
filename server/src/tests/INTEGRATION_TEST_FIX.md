# Integration Test Improvements: Fixing EADDRNOTAVAIL Errors

## Problem
Our integration tests were experiencing intermittent `EADDRNOTAVAIL` errors, particularly when running many tests in parallel:

```
connect EADDRNOTAVAIL 127.0.0.1 - Local (0.0.0.0:60775)
```

This occurred because:
1. `supertest` creates actual network socket connections for HTTP requests
2. When running tests in parallel, we can run out of available sockets
3. Under certain system/network configurations, address binding can fail

## Solution: Handler-Based Testing
We've implemented a handler-based testing approach that avoids network sockets entirely:

1. Instead of making HTTP requests with `supertest`, we test controller functions directly
2. We use mock `Request` and `Response` objects
3. We mock database calls to avoid real DB connections
4. We verify the controller behavior by checking the mocked `Response` object

### Key Benefits
- ✅ No more `EADDRNOTAVAIL` errors
- ✅ Faster test execution (no network overhead)
- ✅ More reliable tests (no connection issues)
- ✅ Better isolation (complete control over test environment)
- ✅ More precise control over mocks and test data

## Implementation
We've successfully converted the Pomodoro tests to use this approach:

1. Created a `setupHandlerTests.ts` utility with testing helpers:
   - `createMockRequest()`: Creates a mock Express request
   - `createMockResponse()`: Creates a mock Express response with Jest spies
   - `createAuthenticatedRequest()`: Creates a mock authenticated request
   - `setupDbMockResponses()`: Sets up mock database responses
   - `setupHandlerTestMocks()`: Sets up all required mocks

2. Updated the `AuthRequest` interface in `auth.middleware.ts` to be exported

3. Created handler-based tests:
   - `pomodoro.handlers.test.ts`: Testing Pomodoro controller functions directly
   - `auth.handlers.test.ts`: Testing Auth controller functions directly

## Remaining Work
The following integration test files still need to be converted to the handler-based approach:

### Auth Tests
- ⬜ auth.routes.test.ts → handlers/auth.routes.handlers.test.ts
- ⬜ auth.api.test.ts → handlers/auth.api.handlers.test.ts (template created)
- ⬜ auth-extended.test.ts → handlers/auth-extended.handlers.test.ts
- ⬜ auth-security.test.ts → handlers/auth-security.handlers.test.ts

### User Tests
- ⬜ user.api.test.ts → handlers/user.api.handlers.test.ts

### Content Tests
- ⬜ playlist.api.test.ts → handlers/playlist.api.handlers.test.ts
- ⬜ song.api.test.ts → handlers/song.api.handlers.test.ts
- ⬜ theme.test.ts → handlers/theme.handlers.test.ts

### Other Tests
- ⬜ pomodoro.api.test.ts → handlers/pomodoro.api.handlers.test.ts
- ⬜ pomodoro.routes.test.ts → handlers/pomodoro.routes.handlers.test.ts
- ⬜ settings.api.test.ts → handlers/settings.api.handlers.test.ts

## How to Convert Tests
We've created a step-by-step guide in `server/src/tests/integration/handlers/README.md` with detailed instructions for converting supertest-based tests to handler-based tests.

### Example Test Conversion

**Before (Supertest):**
```typescript
it('should login successfully', async () => {
  mockPool.setQueryResponses([{ rows: [testUser], rowCount: 1 }]);
  
  const response = await request(testServer)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'password123'
    });
  
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.token).toBeDefined();
});
```

**After (Handler-based):**
```typescript
it('should login successfully', async () => {
  // Get the mock database from the import
  const db = require('../../../config/db');
  
  // Mock the database query
  db.query.mockResolvedValueOnce({
    rows: [testUser],
    rowCount: 1
  });
  
  // Create request and response objects
  const req = createMockRequest({
    body: {
      email: 'test@example.com',
      password: 'password123'
    }
  });
  const res = createMockResponse();
  
  // Call the controller function directly
  await authController.login(req, res);
  
  // Verify response
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: true,
      token: expect.any(String)
    })
  );
});
```

## Conclusion
By converting our integration tests to the handler-based approach, we can eliminate the EADDRNOTAVAIL errors and make our test suite more robust and reliable. This will improve developer productivity and confidence in our test coverage. 