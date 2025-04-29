# VibeFlo

A modern music streaming platform with social features, customizable themes, and productivity tools.

## Project Structure

The project is divided into two main directories:

- `client`: React-based frontend with Material UI
- `server`: Node.js backend with Express

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

### Setup Instructions

#### 1. Client Setup

```bash
cd client
npm install
cp .env.example .env
# Configure your .env file
npm start
```

#### 2. Server Setup

```bash
cd server
npm install
cp .env.example .env
# Configure your .env file with your database credentials
npm run db:migrate
npm run dev
```

## Features

- User authentication (local and OAuth)
- Music streaming and playlist management
- Customizable themes
- Pomodoro timer for productivity
- Social sharing features

## Technologies Used

### Frontend
- React
- Material UI
- TypeScript
- React Router
- Axios

### Backend
- Node.js
- Express
- PostgreSQL
- Passport.js (for authentication)
- JWT

## Contributing

Please read the CONTRIBUTING.md file for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 