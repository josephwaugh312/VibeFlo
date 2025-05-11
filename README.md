# VibeFlo: Advanced Focus & Study App

VibeFlo is a comprehensive study and productivity application centered around the Pomodoro Technique, designed to help users maximize focus, track progress, and create the perfect study environment. With advanced features like customizable timers, integrated to-do lists, ambient music control, and detailed productivity analytics, VibeFlo transforms how you study, work, and focus.

![VibeFlo Dashboard](docs/images/dashboard.png)

## Features Showcase

### 🍅 Pomodoro Timer & Session Tracking
Keep track of your focus sessions with our intuitive timer interface. Each completed session is automatically recorded with accurate duration tracking.

![Pomodoro Timer](docs/images/pomodoro-dashboard.png)

### 📊 Detailed Analytics Dashboard
Monitor your productivity with comprehensive statistics. See your total focus time, completed sessions, and performance insights.

![Stats Dashboard](docs/images/stats-dashboard.png)

### 🎨 Customizable Themes
Create your perfect focus environment with our selection of beautifully designed themes.

![Theme Selector](docs/images/theme-selector.png)

### 🎵 Integrated Music Player
Control your study music without leaving the app. Create and manage playlists for different focus scenarios.

![Music Player](docs/images/playlists.png)

### 👤 User Profile & Authentication
Secure login and profile management that remembers your settings across sessions.

![User Profile](docs/images/profile.png)
![Login Screen](docs/images/login.png)

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

## System Architecture

VibeFlo follows a comprehensive full-stack architecture with clear separation of concerns and focused components.

![VibeFlo System Architecture](docs/images/VibeFlo_System_Architecture_Updated_v2.svg)

### VibeFlo System Architecture Flow Description

#### Overview

VibeFlo is a full-stack web application designed to enhance productivity through the Pomodoro technique while integrating a customizable music experience. The system leverages a structured, scalable architecture with a clear separation of concerns between the frontend, backend, database, and third-party integrations.

#### 1️⃣ Frontend to Backend Communication

**Authentication Flow**
- User authentication requests are sent from the Auth Module in the frontend to the `/api/auth` endpoints on the server.
- Credentials are verified through `auth.controller.ts`, leveraging bcrypt for password hashing.
- On successful authentication, a JSON Web Token (JWT) is generated and returned to the client, where it is stored in local storage and managed through `AuthContext`.
- Subsequent requests include the JWT in the Authorization header for secure access to protected routes.

**Pomodoro Timer Management**
- The `PomodoroTimer.tsx` component manages the timer interface and logic.
- When a session starts or ends, data is sent to `/api/pomodoro/sessions`.
- The backend controller (`pomodoro.controller.ts`) processes this data and stores it in the Pomodoro Sessions table in PostgreSQL.
- The timer's statistics are aggregated in `StatsContext`, and charts are rendered using Recharts.

**Task List (Todos) Management**
- The `TodoList.tsx` component handles task creation, updating, and reordering with drag-and-drop via @dnd-kit.
- Changes are synced with the server through `/api/pomodoro/todos`, managed by `todo.controller.ts`.
- Task data is persisted in the Todos table in the database.

**Music Player Integration**
- The `MusicPlayer.tsx` component allows users to play music via YouTube embeds (react-youtube).
- Playlist management is handled by `playlist.routes.ts`, and CRUD operations are managed in `playlist.controller.ts`.
- Song metadata and playlists are stored in the Playlists and Songs tables, respectively.

**Theme Customization**
- Users can select or create custom themes, managed by `ThemeBackground.tsx` and stored in `SettingsContext`.
- The server manages these themes through `/api/theme` endpoints, interfacing with `theme.controller.ts`.

#### 2️⃣ Backend to Database Interactions

**CRUD Operations**
- Auth Controller → Users: Handles login, registration, and OAuth authentication.
- Pomodoro Controller → Pomodoro Sessions: Manages Pomodoro timer data.
- Todo Controller → Todos: Manages task lists and their states.
- Playlist Controller → Playlists, Songs: Handles music player data.
- Theme Controller → Themes: Manages user-selected themes.

#### 3️⃣ Integrations

**YouTube API**
- The `MusicPlayer.tsx` component interacts with the YouTube API for video playback.

**OAuth Providers**
- Google, GitHub, and Facebook OAuth are handled via passport.js in the backend.
- Tokens are stored in the OAuth Connections table for future reference.

**SendGrid**
- Used for transactional emails such as password resets and verification emails.

#### 4️⃣ Deployment Flow

**Hosting**
- VibeFlo is hosted on Render for both the frontend and backend.

**Database Hosting**
- PostgreSQL is used as the main database, managed through node-postgres.

**CI/CD**
- Automated deployments are managed through GitHub Actions, ensuring every push to main triggers a build and deployment.

#### 5️⃣ Security Layers

**JWT Flow**
- Tokens are generated during login and stored in local storage.
- Tokens are validated via `auth.middleware.ts` on every API request.

**Middleware Security**
- `verified.middleware.ts` ensures email verification.
- `admin.middleware.ts` handles role-based access control for admin-specific features.

#### 6️⃣ Testing and DevOps Integration

**Testing Strategy**
- Unit tests are written for isolated components using Jest.
- Integration tests verify communication between frontend components and backend endpoints.
- End-to-end (E2E) tests are managed through Cypress to ensure user flows function as expected.

**DevOps Practices**
- Database migrations are automated during deployment.
- Docker is used for containerization during local development.

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

## Demo Video

Watch the demo video to see VibeFlo in action: [Watch Video](https://www.loom.com/share/ccf4160871a4473986ac125069fe3eba?sid=557d9b0d-6061-4b1d-aad3-eadcf56a676f) 