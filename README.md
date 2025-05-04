# VibeFlo: Advanced Focus & Study App

VibeFlo is a comprehensive study and productivity application centered around the Pomodoro Technique, designed to help users maximize focus, track progress, and create the perfect study environment. With advanced features like customizable timers, integrated to-do lists, ambient music control, and detailed productivity analytics, VibeFlo transforms how you study, work, and focus.

![VibeFlo Screenshot](https://example.com/screenshot.png)

## Key Features

### 🍅 Advanced Pomodoro Timer
- **Fully Customizable Sessions**: Adjust focus periods, break durations, and long break intervals
- **Session Tracking**: Automatically records completed sessions for analytics
- **Sound & Visual Notifications**: Get alerted when sessions end
- **Auto-start Options**: Configure automatic transitions between work and break periods

### ✅ Smart To-Do Management
- **Drag-and-Drop Task List**: Easily prioritize and rearrange tasks
- **Task Integration**: Link specific tasks to your Pomodoro sessions
- **Progress Tracking**: Automatically mark tasks as completed during your study sessions
- **Persistence**: Tasks are saved between sessions, even when you close your browser

### 🎵 Ambient Study Music
- **YouTube Integration**: Play and control background music directly from YouTube
- **Playlist Builder**: Create and save custom study playlists
- **Background Playback**: Music continues playing as you navigate through the app
- **Volume Control**: Easily adjust audio levels without leaving your focus space

### 🎨 Customizable Study Environments
- **Theme Creator**: Design your perfect study background with custom themes
- **Theme Gallery**: Choose from a library of pre-designed focus environments
- **Community Themes**: Discover and use themes created by other users
- **Persistent Settings**: Your preferred environment is remembered between sessions

### 📊 Detailed Analytics & Insights
- **Focus Trends**: View your productivity patterns over time
- **Session Statistics**: Track total focus time, completed sessions, and more
- **Daily Averages**: Monitor your consistency with average daily metrics
- **Visual Reports**: Easily understand your productivity with intuitive charts and graphs

### 👤 User Profile Management
- **Progress Tracking**: View all your study data in one place
- **Settings Management**: Customize app behavior to match your preferences
- **Cross-Device Syncing**: Access your settings and data from any device

## Security & Authentication

VibeFlo implements robust security protocols to ensure your data remains safe:

- **JWT Authentication**: Secure token-based authentication for all requests
- **Role-Based Access Control**: Protected routes and user-specific content
- **Password Hashing**: Industry-standard bcrypt hashing for credential security
- **Input Sanitization**: Protection against XSS and injection attacks
- **CORS Protection**: Restricted API access to prevent unauthorized usage
- **Error Handling**: Structured error responses without exposing sensitive information
- **OAuth Integration**: Secure third-party authentication options (GitHub, Google)

## Project Structure

The application follows a modern architecture pattern:

- **Client**: React-based frontend with Material UI and TypeScript
- **Server**: Node.js/Express backend with PostgreSQL database

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

### Client Setup

```bash
cd client
npm install
cp .env.example .env
# Configure your .env file
npm start
```

### Server Setup

```bash
cd server
npm install
cp .env.example .env
# Configure your .env file with your database credentials
npm run db:migrate
npm run dev
```

## Environment Configuration

### Required Environment Variables

#### Client (.env)
```
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key
```

#### Server (.env)
```
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:5432/vibeflo
JWT_SECRET=your_jwt_secret
```

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## OAuth Setup

To configure third-party authentication, see [OAUTH_SETUP_GUIDE.md](OAUTH_SETUP_GUIDE.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- The Pomodoro Technique was developed by Francesco Cirillo
- Special thanks to all contributors who have helped make VibeFlo better 