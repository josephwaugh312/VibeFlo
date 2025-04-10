# VibeFlo Music Player

A React music player application with YouTube and Spotify integration.

## Features

- YouTube video integration for music playback
- Spotify integration for accessing your playlists
- Clean and responsive UI with playlist management
- Music controls (play, pause, previous, next)

## Setting Up Spotify Integration

To use the Spotify integration features, follow these steps:

1. **Create a Spotify Developer Account**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
   - Log in with your Spotify account or create one if you don't have it
   - Click "Create an App"
   - Fill in the app name (e.g., "VibeFlo") and description
   - Accept the terms and click "Create"

2. **Configure Your Spotify App**
   - From your app dashboard, click "Edit Settings"
   - Add the following Redirect URI: `http://localhost:3000/spotify-callback`
   - Save your changes

3. **Set Up Environment Variables**
   - Copy the `.env.example` file to a new file named `.env`
   - Fill in your Spotify Client ID from the Spotify Developer Dashboard:
   ```
   REACT_APP_SPOTIFY_CLIENT_ID=your_client_id_here
   REACT_APP_SPOTIFY_REDIRECT_URI=http://localhost:3000/spotify-callback
   ```

4. **Restart Your Development Server**
   - If your app is running, stop it and restart with `npm start`

## Usage

### YouTube Integration
1. Click on the music note icon to open the music player
2. Navigate to the "YouTube" tab
3. Paste a YouTube URL and click "Add"
4. The video will be added to your playlist and start playing

### Spotify Integration
1. Click on the music note icon to open the music player
2. Navigate to the "Spotify" tab
3. Click "Connect Spotify" and authorize the application
4. After authorization, you can view and import your Spotify playlists

## Developer Notes

The Spotify integration uses the following components:
- `spotifyService` - Handles API calls and authentication
- `SpotifyPlayer` - Web Playback SDK integration for playing tracks
- `SpotifyCallback` - Handles OAuth callback and token storage

## Troubleshooting

If you encounter issues with Spotify integration:
1. Ensure your Client ID is correct
2. Check that your redirect URI is properly configured in the Spotify Dashboard
3. Make sure you've accepted the terms of use for the Spotify Developer Dashboard
4. Check browser console for any API error messages

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
