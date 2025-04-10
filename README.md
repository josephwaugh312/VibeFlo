# VibeFlo - Pomodoro Timer App

VibeFlo is a full-stack web application for productivity using the Pomodoro Technique. It helps users manage their time effectively by breaking work into intervals, traditionally 25 minutes in length, separated by short breaks.

## Features

- **Pomodoro Timer**: Customizable work and break intervals
- **Task Management**: Track tasks you're working on during each session
- **Statistics**: View your productivity metrics and history
- **User Authentication**: Register, login, and password reset functionality
- **Theme Customization**: Choose from various themes to personalize your experience
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React, TypeScript, Material UI, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT, bcrypt for password hashing
- **State Management**: React Context

## Getting Started

### Prerequisites

- Node.js (v14 or newer) and npm
- PostgreSQL database

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/VibeFlo.git
   cd VibeFlo
   ```

2. Install server dependencies:
   ```
   cd server
   npm install
   ```

3. Install client dependencies:
   ```
   cd ../client
   npm install
   ```

4. Set up your environment variables:
   - Copy `.env.example` to `.env` in the server directory
   - Update the values with your database credentials and API keys
   ```
   cp .env.example .env
   ```

5. Set up the database:
   - Create a PostgreSQL database named "vibeflo"
   - Run the migrations to set up tables:
     ```
     npm run migrate
     ```

### Running the App

1. Start the server (default port 5001):
   ```
   cd server
   npm run dev
   ```

2. Start the client (default port 3000):
   ```
   cd client
   npm start
   ```

3. Open your browser and go to `http://localhost:3000`

## Usage

1. Register for an account or log in
2. Set up your Pomodoro timer preferences in Settings
3. Add tasks to your to-do list
4. Start a Pomodoro session and select a task to work on
5. View your progress in the Stats section

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License. 