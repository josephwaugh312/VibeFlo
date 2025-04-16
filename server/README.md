# VibeFlo Server

Backend service for the VibeFlo music application.

## Technology Stack

- Node.js + Express
- TypeScript
- PostgreSQL
- Jest for testing

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file in the server directory with the following variables:
```
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:5432/vibeflo
JWT_SECRET=your_jwt_secret
```

3. Start the development server:
```bash
npm run dev
```

## Project Structure

- `/src`: Source code
  - `/config`: Configuration files
  - `/controllers`: Request handlers
  - `/middleware`: Express middleware
  - `/routes`: API routes
  - `/services`: Business logic
  - `/types`: TypeScript type definitions
  - `/utils`: Utility functions
  - `/tests`: Test files

## Testing

We've implemented a comprehensive testing framework using Jest. See [TESTING.md](./TESTING.md) for detailed information about:

- Running tests (standalone, with database, etc.)
- Mock database adapter implementation
- Test best practices
- CI/CD integration

## API Documentation

API endpoints are organized by resource:

### Auth
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in a user
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/password` - Change password
- `DELETE /api/users` - Delete account

### Themes
- `GET /api/themes` - Get user's themes
- `POST /api/themes` - Create a theme
- `GET /api/themes/:id` - Get a theme
- `PUT /api/themes/:id` - Update a theme
- `DELETE /api/themes/:id` - Delete a theme

### Playlists
- `GET /api/playlists` - Get user's playlists
- `POST /api/playlists` - Create a playlist
- `GET /api/playlists/:id` - Get a playlist
- `PUT /api/playlists/:id` - Update a playlist
- `DELETE /api/playlists/:id` - Delete a playlist
- `POST /api/playlists/:id/tracks` - Add tracks to playlist
- `DELETE /api/playlists/:id/tracks/:trackId` - Remove track from playlist 