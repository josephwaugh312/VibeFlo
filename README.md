# VibeFlo

VibeFlo is a full-stack productivity application that combines task management with music integration to enhance focus and workflow.

## Features

- **User Authentication**: Secure login, registration, and profile management
- **Task Management**: Create, organize, and track your todos
- **Music Integration**: Play and control music while working
- **Profile Customization**: Personalize your profile with avatars and themes
- **Responsive Design**: Works seamlessly across devices

## Tech Stack

### Frontend
- React.js with TypeScript
- Material-UI for component styling
- Context API for state management
- Axios for API requests
- Jest and React Testing Library for testing

### Backend
- Node.js with Express.js
- PostgreSQL database
- JWT for authentication
- Bcrypt for password hashing
- Jest for testing

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/vibeflo.git
cd vibeflo
```

2. Install dependencies for both client and server
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Create a `.env` file in the server directory with the following variables:
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/vibeflo
JWT_SECRET=your_jwt_secret
EMAIL_SERVICE=smtp.example.com
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
CLIENT_URL=http://localhost:3000
```

4. Create a PostgreSQL database
```bash
createdb vibeflo
```

5. Run database migrations
```bash
cd server
npm run migrate
```

### Running the Application

1. Start the server
```bash
cd server
npm run dev
```

2. Start the client (in another terminal)
```bash
cd client
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Development

### Server Structure
```
server/
├── src/
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── models/         # Database models
│   ├── utils/          # Utility functions
│   ├── tests/          # Test files
│   └── app.ts          # Express application
├── migrations/         # Database migrations
└── package.json
```

### Client Structure
```
client/
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── utils/          # Utility functions
│   ├── __tests__/      # Test files
│   ├── App.tsx         # Root component
│   └── index.tsx       # Entry point
└── package.json
```

## Testing

The VibeFlo project includes various types of tests:

### Basic Unit Tests
- Located in `server/src/tests/unit/`
- Run with `npm run test:unit`
- These tests verify the basic functionality of individual components

### Integration Tests
- Located in `server/src/tests/integration/`
- Run with `npm run test:integration`
- These tests verify the interaction between different components

### All Tests
- Run all tests with `npm test`

### Database Setup
For integration tests that require database access, you need to:
1. Make sure PostgreSQL is running and accessible
2. Configure your database connection in `.env.test`

Note: Basic unit tests do not require a database connection.

## Deployment

The application is configured for deployment to various platforms:

- Frontend: Vercel, Netlify, or AWS Amplify
- Backend: Heroku, AWS Elastic Beanstalk, or Docker containers

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Material-UI](https://mui.com/)
- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Jest](https://jestjs.io/) 