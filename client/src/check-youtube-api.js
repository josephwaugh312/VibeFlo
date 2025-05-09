// Simple script to log environment variables for debugging
console.log('Checking environment variables:');
console.log('REACT_APP_YOUTUBE_API_KEY:', process.env.REACT_APP_YOUTUBE_API_KEY || 'NOT SET');
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL || 'NOT SET');

// Display YouTube API key status
if (!process.env.REACT_APP_YOUTUBE_API_KEY) {
  console.error('ERROR: YouTube API key is missing!');
  console.log('Please set REACT_APP_YOUTUBE_API_KEY in your environment variables.');
  console.log('For Render deployment, add this as an environment variable in the Render dashboard.');
} else {
  const keyPreview = process.env.REACT_APP_YOUTUBE_API_KEY.substring(0, 5) + '...' + 
                    process.env.REACT_APP_YOUTUBE_API_KEY.substring(process.env.REACT_APP_YOUTUBE_API_KEY.length - 5);
  console.log('YouTube API key is set! (Preview: ' + keyPreview + ')');
}

// This is purely for debugging, will be removed from the final build
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window !== 'undefined') {
    window.checkYouTubeApiKey = () => {
      console.log('YouTube API Key check from browser:');
      console.log('REACT_APP_YOUTUBE_API_KEY:', process.env.REACT_APP_YOUTUBE_API_KEY ? 'SET (but value not shown for security)' : 'NOT SET');
    };
    console.log('Added checkYouTubeApiKey() function to window object for debugging');
  }
}); 