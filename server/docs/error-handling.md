# Error Handling in VibeFlo Server

This document outlines the error handling approach used in the VibeFlo server application.

## Key Components

The error handling system consists of several key components:

1. **AppError Class**: A custom error class that standardizes error creation with status codes and error types
2. **Error Middleware**: Express middleware for handling errors and sending appropriate responses
3. **Error Utilities**: Helper functions for creating common types of errors
4. **Database Error Middleware**: Specific middleware for handling database-related errors

## Using the AppError Class

The `AppError` class extends the standard JavaScript `Error` class and adds additional properties for status codes and error types.

```typescript
import { AppError } from '../utils/errors';

// Basic usage
throw new AppError('Something went wrong', 500, 'SERVER_ERROR');

// Using static methods
throw AppError.notFound('User not found', 'USER_NOT_FOUND');
throw AppError.unauthorized('Invalid token', 'INVALID_TOKEN');
```

## Common Error Utility Functions

The error utilities provide shortcuts for common error scenarios:

```typescript
import { authErrors, resourceErrors, validationErrors } from '../utils/errorUtils';

// Authentication errors
throw authErrors.notAuthenticated();
throw authErrors.notAuthorized();
throw authErrors.invalidCredentials();

// Resource errors
throw resourceErrors.notFound('User', 123);
throw resourceErrors.alreadyExists('User', 'email', 'user@example.com');

// Validation errors
throw validationErrors.required('Username');
throw validationErrors.invalidFormat('Email', 'user@example.com');
throw validationErrors.tooShort('Password', 8);
```

## Async Route Handler Wrapper

To avoid try/catch blocks in every route handler, use the `handleAsync` wrapper:

```typescript
import { handleAsync } from '../utils/errorHandler';

export const getUser = handleAsync(async (req, res) => {
  const { id } = req.params;
  
  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  
  if (!user) {
    throw resourceErrors.notFound('User', id);
  }
  
  res.json(user);
});
```

## Error Response Format

Errors are returned in the following format:

```json
{
  "error": "User not found",
  "code": "RESOURCE_NOT_FOUND",
  "path": "/api/users/123"
}
```

In development mode, additional debug information is included:

```json
{
  "error": "User not found",
  "code": "RESOURCE_NOT_FOUND",
  "path": "/api/users/123",
  "stack": "Error: User not found\n    at ...",
  "originalError": {
    "message": "Error querying database",
    "name": "DatabaseError"
  }
}
```

## Database Error Handling

Database errors are automatically converted to appropriate HTTP responses:

- **Missing table** (42P01): 500 Internal Server Error
- **Missing column** (42703): 500 Internal Server Error
- **Unique violation** (23505): 409 Conflict
- **Foreign key violation** (23503): 400 Bad Request
- **Not null violation** (23502): 400 Bad Request

## Best Practices

1. **Use AppError for all errors**: Avoid throwing raw Error objects or returning error responses directly
2. **Be specific with error codes**: Use descriptive error codes to help clients understand the error
3. **Use handleAsync**: Always wrap route handlers in handleAsync to ensure errors are caught
4. **Use error utilities**: Prefer the error utility functions over creating AppError instances directly
5. **Add context to errors**: Include relevant information in error messages to help with debugging

## Example

```typescript
import { handleAsync } from '../utils/errorHandler';
import { authErrors, resourceErrors, validationErrors } from '../utils/errorUtils';

export const createPost = handleAsync(async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user?.id;
  
  if (!userId) {
    throw authErrors.notAuthenticated();
  }
  
  if (!title) {
    throw validationErrors.required('Title');
  }
  
  if (!content) {
    throw validationErrors.required('Content');
  }
  
  if (title.length < 5) {
    throw validationErrors.tooShort('Title', 5);
  }
  
  const post = await db.query(
    'INSERT INTO posts (title, content, user_id) VALUES ($1, $2, $3) RETURNING *',
    [title, content, userId]
  );
  
  res.status(201).json(post);
}); 