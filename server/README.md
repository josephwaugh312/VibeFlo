# VibeFlo: Advanced Focus & Study App (Server)

Backend API service for VibeFlo, a comprehensive productivity and study application centered around the Pomodoro Technique.

## Core Features

### 🔐 Authentication & Security
- JWT-based authentication system
- Password hashing with bcrypt
- Role-based access control
- OAuth integration (GitHub, Google)
- Input sanitization to prevent XSS/injection attacks
- CORS protection

### 📊 Data Management
- Session tracking and statistics
- User profile and settings management
- Theme storage and retrieval
- Playlist and music track storage
- Todo list persistence

### 🔄 API Endpoints
- **Auth**: Registration, login, verification, password reset
- **User**: Profile management, settings
- **Pomodoro**: Session tracking, statistics
- **Themes**: Custom theme creation and management
- **Playlists**: Music playlist management
- **Todo**: Task management and persistence

## Technology Stack

- **Backend**: Node.js + Express
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT + Passport.js
- **Testing**: Jest

## Getting Started

### Prerequisites
- Node.js (v14+)
- PostgreSQL database
- npm or yarn

### Installation
```bash
# Clone the repository (if not already done)
git clone https://github.com/your-username/VibeFlo.git
cd VibeFlo/server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Set up your database configuration in .env
# Required: DATABASE_URL, JWT_SECRET

# Run database migrations
npm run db:migrate

# Start the development server
npm run dev
```

### Environment Configuration
Create a `.env` file with the following variables:
```
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:5432/vibeflo
JWT_SECRET=your_secure_jwt_secret
OAUTH_GITHUB_CLIENT_ID=your_github_client_id
OAUTH_GITHUB_CLIENT_SECRET=your_github_client_secret
OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Project Structure

- `/src` - Source code
  - `/config` - Configuration files (database, passport)
  - `/controllers` - Request handlers
  - `/middleware` - Express middleware (auth, error handling)
  - `/routes` - API routes
  - `/services` - Business logic
  - `/utils` - Utility functions
  - `/db` - Database migration scripts
  - `/tests` - Test files

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in a user
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### User Endpoints
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/password` - Change password
- `DELETE /api/users` - Delete account

### Pomodoro Endpoints
- `GET /api/pomodoro/stats` - Get user's pomodoro statistics
- `GET /api/pomodoro/sessions` - Get user's pomodoro sessions
- `POST /api/pomodoro/sessions` - Create a new pomodoro session
- `DELETE /api/pomodoro/sessions/:id` - Delete a pomodoro session

### Theme Endpoints
- `GET /api/themes` - Get standard themes
- `GET /api/themes/custom/user` - Get user's custom themes
- `GET /api/themes/custom/public` - Get public custom themes
- `POST /api/themes/custom` - Create a custom theme
- `DELETE /api/themes/custom/:id` - Delete a custom theme

### Settings Endpoints
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

### Testing

We use Jest for comprehensive testing. To run tests:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage
```

## Security Features

VibeFlo implements several security best practices:

1. **Authentication**: JWT tokens with proper expiration and refresh capabilities
2. **Data Protection**: Input validation and sanitization on all endpoints
3. **Password Security**: bcrypt hashing with appropriate salt rounds
4. **Rate Limiting**: Protection against brute force attacks
5. **Error Handling**: Structured error responses without exposing internals
6. **CORS Policy**: Restricted API access to trusted origins

## Contributing
Contributions are welcome! Please feel free to submit a pull request.

## License
This project is licensed under the MIT License - see the LICENSE file for details. 