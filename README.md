# 🎵 VibeFlo – Focus & Productivity App

## Overview
VibeFlo is a full-stack productivity app that blends the Pomodoro Technique with personalized music integration. It helps students and professionals stay focused, track progress, and create the perfect study environment by combining timers, tasks, playlists, and analytics into one seamless experience.

![VibeFlo Dashboard](docs/images/dashboard.png)

## 🎯 Why VibeFlo

**Problem:** Productivity apps often feel rigid and uninspiring, lacking personalization and engagement.

**Solution:** VibeFlo pairs focus sessions with customizable music and environments, making productivity both effective and enjoyable.

**Outcome:** A tool that not only tracks focus time, but motivates users to sustain deep work through personalization and behavioral design.

## ✨ Core Features

### Pomodoro Timer & To-Do Integration
- **Customizable focus/break intervals** with auto-start options
- **Drag-and-drop to-do list** linked directly to focus sessions
- **Automatic session tracking** for analytics
- **Sound & visual notifications** when sessions complete

![Pomodoro Timer](docs/images/pomodoro-dashboard.png)

### Personalized Study Environment
- **Integrated YouTube music player** with playlist builder
- **Theme customization** (dark/light, custom, community themes)
- **Settings saved** across sessions/devices
- **Background playback** continues while you work

![Music Player](docs/images/playlists.png)
![Theme Selector](docs/images/theme-selector.png)

### Analytics & Insights
- **Productivity dashboard** with focus trends and session stats
- **Visual charts** for workload balance and consistency
- **Daily averages and streaks** to encourage habits
- **Performance patterns** to optimize your schedule

![Stats Dashboard](docs/images/stats-dashboard.png)

### User Profiles & Security
- **Secure authentication** (JWT, bcrypt)
- **Role-based access control** and OAuth login options
- **Persistent cross-device syncing**
- **Privacy-focused data handling**

![User Profile](docs/images/profile.png)
![Login Screen](docs/images/login.png)

## 🛠️ Implementation (Tech Stack)

**Frontend:** React, TypeScript, Material UI, Recharts

**Backend:** Node.js/Express, PostgreSQL

**Integrations:** YouTube API for music, OAuth providers (Google/GitHub)

**Testing & DevOps:** Jest, Cypress, Docker, GitHub Actions CI/CD, Render hosting

## 🚀 Getting Started

```bash
# Clone repository
git clone https://github.com/josephwaugh312/vibeflo.git

# Client setup
cd client
npm install
cp .env.example .env
npm start

# Server setup
cd server
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

### Environment Variables

**Client (.env)**
```
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key
```

**Server (.env)**
```
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:5432/vibeflo
JWT_SECRET=your_jwt_secret
```

## 🔮 Roadmap

- **Gamification** – badges, streak rewards, achievement system
- **Mobile app support** – React Native / PWA
- **Enhanced analytics** with AI-driven insights
- **Team focus sessions** with shared playlists
- **Spotify integration** for premium music experience
- **Calendar sync** for automatic session scheduling
- **Export capabilities** for productivity reports

## 🎬 Demo

Watch VibeFlo in action: [Demo Video](https://www.loom.com/share/ccf4160871a4473986ac125069fe3eba?sid=557d9b0d-6061-4b1d-aad3-eadcf56a676f)

## 🤝 Contributing

Contributions are welcome! Please submit a PR and follow our testing & documentation guidelines.

For detailed technical documentation:
- [Deployment Guide](DEPLOYMENT.md)
- [OAuth Setup](OAUTH_SETUP_GUIDE.md)
- [System Architecture](docs/images/VibeFlo_System_Architecture_Updated_v2.svg)

## 📄 License

MIT License – see [LICENSE](LICENSE) file.

## ⭐ Why This Matters

VibeFlo transforms productivity from a chore into an experience. By combining proven focus techniques with personalization and data-driven insights, we're helping thousands of users achieve their goals while enjoying the process.

---

*Built with ❤️ for students, remote workers, and anyone seeking focused productivity*