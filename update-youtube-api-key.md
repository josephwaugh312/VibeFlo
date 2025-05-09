# Guide: Setting up YouTube API Key on Render

The search functionality in VibeFlo's music player requires a valid YouTube API key. This guide explains how to set it up on your Render deployment.

## Step 1: Create a YouTube API Key

If you don't already have a YouTube API key:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Navigate to "APIs & Services" > "Library"
4. Search for "YouTube Data API v3" and enable it
5. Go to "APIs & Services" > "Credentials"
6. Click "Create Credentials" > "API Key"
7. (Optional but recommended) Restrict the key:
   - Under "API restrictions", select "YouTube Data API v3"
   - Under "Application restrictions" > "HTTP referrers", add your domains:
     - `https://vibeflo.app/*`
     - `https://vibeflo.onrender.com/*`
     - `http://localhost:3000/*` (for local development)

## Step 2: Add the API Key to Render

1. Log in to your [Render Dashboard](https://dashboard.render.com/)
2. Navigate to your VibeFlo web service (the client app)
3. Go to the "Environment" tab
4. Click "Add Environment Variable"
5. Enter the following:
   - **Key**: `REACT_APP_YOUTUBE_API_KEY`
   - **Value**: Your YouTube API key (e.g., `AIzaSyA...`)
6. Click "Save Changes"

## Step 3: Rebuild the Application

After adding the environment variable, you need to rebuild the application:

1. Still on your web service page, go to the "Events" tab
2. Click the "Manual Deploy" button > "Deploy latest commit"
3. Wait for the build and deployment to complete

## Step 4: Verify the API Key is Working

1. Once deployed, visit your VibeFlo app
2. Open the music player and go to the search tab
3. Try searching for a song
4. If the search works, you'll see YouTube search results

## Troubleshooting

If search still doesn't work after setting up the API key:

1. **Check Quota Limits**: YouTube API has daily quotas. Check if you've exceeded them.
2. **Verify API Key**: Ensure the key is correctly entered and has no extra spaces.
3. **API Restrictions**: If you restricted the key, make sure the domain you're accessing from is allowed.
4. **Check Console Errors**: Open your browser's developer console to see specific error messages.

For further assistance, refer to [YouTube API Documentation](https://developers.google.com/youtube/v3/getting-started). 