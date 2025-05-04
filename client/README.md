# VibeFlo: Advanced Focus & Study App (Client)

The frontend application for VibeFlo, a comprehensive productivity and study app centered around the Pomodoro Technique.

## Core Features

### 🍅 Pomodoro Timer System
- Customizable work/break durations
- Session tracking and statistics
- Visual and audio notifications
- Automatic session transitions

### ✅ Task Management
- Drag-and-drop to-do list interface
- Task-session linking for focused work
- Automatic progress tracking
- Local storage persistence

### 🎵 Study Music Integration
- YouTube-based music player
- Custom playlist creation and management
- Background music playback across app navigation
- Volume and playback controls

### 🎨 Customizable Environments
- Theme creator with background customization
- Pre-designed theme gallery
- Community theme sharing
- Environment persistence across sessions

### 📊 Analytics Dashboard
- Focus time tracking
- Session completion statistics
- Productivity pattern visualization
- Progress trends over time

## Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Active internet connection (for YouTube API)

### Installation
```bash
# Clone the repository (if not already done)
git clone https://github.com/your-username/VibeFlo.git
cd VibeFlo/client

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your configuration
# Required: REACT_APP_API_URL, REACT_APP_YOUTUBE_API_KEY

# Start the development server
npm start
```

### Environment Configuration
Create a `.env` file with the following variables:
```
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key
```

## Integration Points
The client application integrates with:
- VibeFlo API server for data persistence
- YouTube API for music playback
- OAuth providers for authentication (GitHub, Google)

## Project Structure
- `/src` - Source code
  - `/components` - React components
  - `/contexts` - React context providers
  - `/pages` - Page-level components
  - `/services` - API services
  - `/utils` - Helper utilities
  - `/hooks` - Custom React hooks

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner in interactive watch mode

### `npm run build`
Builds the app for production to the `build` folder

## Contributing
Contributions are welcome! Please feel free to submit a pull request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
