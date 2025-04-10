// Spotify API integration
import { api } from './api';

// You'll need to register your app at https://developer.spotify.com/dashboard
// and add these environment variables to your .env file
const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/spotify-callback';

// Log configuration for debugging
console.log('Spotify configuration:');
console.log('- Client ID length:', SPOTIFY_CLIENT_ID.length);
console.log('- Redirect URI:', SPOTIFY_REDIRECT_URI);

// Scopes define what your application can access
// See https://developer.spotify.com/documentation/general/guides/scopes/
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-library-read',
  'user-library-modify',
  'streaming'
];

// Generate a random string for the state parameter
const generateRandomString = (length: number): string => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// Store tokens in localStorage
const TOKEN_KEY = 'spotify_access_token';
const TOKEN_EXPIRY_KEY = 'spotify_token_expiry';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';

// Spotify API service
const spotifyService = {
  // Get authorization URL for Spotify login
  getAuthorizationUrl(): string {
    if (!SPOTIFY_CLIENT_ID) {
      console.error('Spotify Client ID is not configured');
      throw new Error('Spotify Client ID is missing. Please check your .env file.');
    }
    
    // Clear any existing state before generating a new one
    localStorage.removeItem('spotify_auth_state');
    
    // Generate a longer state parameter for better security
    const state = generateRandomString(32);
    localStorage.setItem('spotify_auth_state', state);
    
    console.log('Generated new Spotify auth state:', state.substring(0, 6) + '...');
    
    const args = new URLSearchParams({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: SCOPES.join(' '),
      redirect_uri: SPOTIFY_REDIRECT_URI,
      state: state,
      show_dialog: 'true' // Force the user to approve the app again
    });
    
    const authUrl = `https://accounts.spotify.com/authorize?${args.toString()}`;
    console.log('Generated auth URL:', authUrl.substring(0, 80) + '...');
    return authUrl;
  },
  
  // Handle the Spotify callback with auth code
  async handleCallback(code: string): Promise<boolean> {
    try {
      console.log('Handling callback with code:', code.substring(0, 5) + '...');
      
      // Check state in localStorage to verify it was properly stored
      const storedState = localStorage.getItem('spotify_auth_state');
      console.log('State at callback handle time:', storedState ? storedState.substring(0, 6) + '...' : 'null');
      
      // Clear any existing tokens first to ensure we don't have stale data
      this.logout();
      
      // Exchange code for tokens using our backend API
      const response = await api.post('/spotify/exchange-token', { code });
      const data = response.data;
      
      if (!data || !data.access_token) {
        console.error('No access token received from Spotify');
        return false;
      }
      
      console.log('Received valid token response. Token starts with:', data.access_token.substring(0, 10) + '...');
      
      const expiresAt = Date.now() + (data.expires_in * 1000);
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
      
      return true;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return false;
    }
  },
  
  // Check if the user is authenticated with Spotify
  isAuthenticated(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiryString = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!token || !expiryString) return false;
    
    const expiry = parseInt(expiryString, 10);
    return Date.now() < expiry;
  },
  
  // Get access token, refreshing if needed
  async getAccessToken(): Promise<string | null> {
    console.log('Spotify service: Getting access token');
    
    try {
      const accessToken = localStorage.getItem(TOKEN_KEY);
      const expiresAt = localStorage.getItem(TOKEN_EXPIRY_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      
      console.log('Token status:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasExpiresAt: !!expiresAt
      });
      
      // Check if access token exists and is valid
      if (accessToken && expiresAt) {
        const expiresTime = parseInt(expiresAt, 10);
        const now = Date.now();
        
        console.log('Token expires in:', (expiresTime - now) / 1000, 'seconds');
        
        // If token is expired and we have a refresh token, get a new access token
        if (now >= expiresTime && refreshToken) {
          console.log('Token expired, attempting refresh');
          return await this.refreshToken();
        }
        
        // Token is valid
        if (now < expiresTime) {
          console.log('Using existing valid token');
          return accessToken;
        }
      }
      
      // If we have a token but no expiry, assume it's valid for now
      // This helps with the transition to the new token storage format
      if (accessToken && !expiresAt) {
        console.log('Token exists with no expiry, using it anyway');
        // Set an expiry for future checks (1 hour from now)
        localStorage.setItem(TOKEN_EXPIRY_KEY, (Date.now() + 3600 * 1000).toString());
        return accessToken;
      }
      
      // No valid token and no refresh token
      if (!refreshToken) {
        console.log('No refresh token available, user needs to re-authenticate');
        return null;
      }
      
      // Try refreshing with available refresh token
      return await this.refreshToken();
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },
  
  // Refresh the access token
  async refreshToken(): Promise<string | null> {
    console.log('Attempting to refresh Spotify token');
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (!refreshToken) {
      console.log('No refresh token found');
      return null;
    }
    
    try {
      // Use the real backend endpoint to refresh the token
      const response = await api.post('/spotify/refresh-token', { refresh_token: refreshToken });
      
      // If we get here, we have a successful response
      if (response.data && response.data.access_token) {
        const expiresAt = Date.now() + (response.data.expires_in * 1000);
        localStorage.setItem(TOKEN_KEY, response.data.access_token);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
        
        console.log('Token successfully refreshed with backend');
        return response.data.access_token;
      } else {
        console.error('Refresh response did not contain access_token');
        this.logout(); // Clear invalid tokens
        return null;
      }
    } catch (error) {
      console.error('Failed to refresh token with API:', error);
      
      // Provide more debugging information
      console.log('Using real authentication flow, not mock tokens');
      this.logout();
      return null;
    }
  },
  
  // Helper method to handle API errors
  handleApiError(error: any) {
    console.error('Spotify API error:', error);
    
    // Check if this is an auth error
    if (error.response && error.response.status === 401) {
      console.log('Received 401 from Spotify API, logging out');
      this.logout();
      return true;
    }
    
    return false;
  },
  
  // Get user's Spotify profile
  async getUserProfile() {
    const token = await this.getAccessToken();
    if (!token) return null;
    
    try {
      const response = await api.post('/spotify/profile', { access_token: token });
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },
  
  // Get user's playlists
  async getUserPlaylists() {
    const token = await this.getAccessToken();
    if (!token) return null;
    
    try {
      const response = await api.post('/spotify/playlists', { access_token: token });
      return response.data;
    } catch (error) {
      if (this.handleApiError(error)) {
        // If it was an auth error, return a special response
        return { authError: true };
      }
      console.error('Error fetching playlists:', error);
      return null;
    }
  },
  
  // Get tracks from a specific playlist
  async getPlaylistTracks(playlistId: string) {
    const token = await this.getAccessToken();
    if (!token) return null;
    
    try {
      const response = await api.post('/spotify/playlist-tracks', { 
        access_token: token,
        playlist_id: playlistId
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
      return null;
    }
  },
  
  // Create a new playlist
  async createPlaylist(userId: string, name: string, description?: string, isPublic: boolean = false) {
    const token = await this.getAccessToken();
    if (!token) return null;
    
    try {
      const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          public: isPublic
        })
      });
      
      return response.json();
    } catch (error) {
      console.error('Error creating playlist:', error);
      return null;
    }
  },
  
  // Add tracks to a playlist
  async addTracksToPlaylist(playlistId: string, trackUris: string[]) {
    const token = await this.getAccessToken();
    if (!token) return null;
    
    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: trackUris
        })
      });
      
      return response.json();
    } catch (error) {
      console.error('Error adding tracks to playlist:', error);
      return null;
    }
  },
  
  // Search for tracks
  async searchTracks(query: string) {
    const token = await this.getAccessToken();
    if (!token) return null;
    
    try {
      const response = await api.post('/spotify/search', {
        access_token: token,
        query
      });
      return response.data;
    } catch (error) {
      console.error('Error searching tracks:', error);
      return null;
    }
  },
  
  // Clear all tokens and log out
  logout(): void {
    console.log('Spotify service: logging out and clearing all tokens and state');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('spotify_auth_state');
    console.log('Spotify service: logout complete');
  }
};

export default spotifyService; 