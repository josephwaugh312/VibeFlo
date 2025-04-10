import { Request, Response } from 'express';
import axios from 'axios';
import querystring from 'querystring';
import { handleAsync } from '../utils/errorHandler';

// Spotify API credentials - these should be in environment variables
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/spotify-callback';

// Helper function to extract error details
const getErrorDetails = (error: unknown): string => {
  if (error && typeof error === 'object') {
    if ('response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
      return String(error.response.data);
    }
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }
  return 'Unknown error occurred';
};

// Controller methods
export const spotifyController = {
  // Exchange authorization code for access and refresh tokens
  exchangeToken: handleAsync(async (req: Request, res: Response) => {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }
    
    try {
      const response = await axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: querystring.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: SPOTIFY_REDIRECT_URI
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
        }
      });
      
      // Return tokens to client
      return res.json(response.data);
    } catch (error) {
      console.error('Error exchanging Spotify token:', error);
      return res.status(500).json({ 
        error: 'Failed to exchange Spotify token',
        details: getErrorDetails(error)
      });
    }
  }),
  
  // Refresh access token using refresh token
  refreshToken: handleAsync(async (req: Request, res: Response) => {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ error: 'Missing refresh token' });
    }
    
    try {
      const response = await axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: querystring.stringify({
          grant_type: 'refresh_token',
          refresh_token
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
        }
      });
      
      // Return new access token to client
      return res.json(response.data);
    } catch (error) {
      console.error('Error refreshing Spotify token:', error);
      return res.status(500).json({ 
        error: 'Failed to refresh Spotify token',
        details: getErrorDetails(error)
      });
    }
  }),
  
  // Get user's Spotify profile as a proxy to avoid exposing access token in client
  getUserProfile: handleAsync(async (req: Request, res: Response) => {
    const { access_token } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Missing access token' });
    }
    
    try {
      const response = await axios({
        method: 'get',
        url: 'https://api.spotify.com/v1/me',
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      
      return res.json(response.data);
    } catch (error) {
      console.error('Error fetching Spotify user profile:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch Spotify user profile',
        details: getErrorDetails(error)
      });
    }
  }),
  
  // Get user's playlists as a proxy
  getUserPlaylists: handleAsync(async (req: Request, res: Response) => {
    const { access_token } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Missing access token' });
    }
    
    // Check if we're dealing with a mock token
    if (access_token.includes('mock_')) {
      console.error('Using mock token for Spotify API call. This will not work with the real Spotify API.');
      return res.status(401).json({
        error: 'Mock token detected. Please authenticate with Spotify again.',
        details: 'The current token is a mock token which cannot be used with the real Spotify API.'
      });
    }
    
    console.log('Fetching playlists with access token starting with:', access_token.substring(0, 10) + '...');
    
    try {
      const response = await axios({
        method: 'get',
        url: 'https://api.spotify.com/v1/me/playlists',
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      
      console.log('Successfully fetched playlists. Count:', response.data.items?.length || 0);
      return res.json(response.data);
    } catch (error) {
      console.error('Error fetching Spotify playlists:', error);
      
      // Log more details about axios errors
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response) {
          console.error('Spotify API error response:', {
            status: axiosError.response.status,
            statusText: axiosError.response.statusText,
            data: axiosError.response.data
          });
        }
      }
      
      return res.status(500).json({ 
        error: 'Failed to fetch Spotify playlists',
        details: getErrorDetails(error)
      });
    }
  }),
  
  // Get playlist tracks as a proxy
  getPlaylistTracks: handleAsync(async (req: Request, res: Response) => {
    const { access_token, playlist_id } = req.body;
    
    if (!access_token || !playlist_id) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    try {
      const response = await axios({
        method: 'get',
        url: `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      
      return res.json(response.data);
    } catch (error) {
      console.error('Error fetching Spotify playlist tracks:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch Spotify playlist tracks',
        details: getErrorDetails(error)
      });
    }
  }),
  
  // Search for tracks as a proxy
  searchTracks: handleAsync(async (req: Request, res: Response) => {
    const { access_token, query } = req.body;
    
    if (!access_token || !query) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    try {
      const response = await axios({
        method: 'get',
        url: `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      
      return res.json(response.data);
    } catch (error) {
      console.error('Error searching Spotify tracks:', error);
      return res.status(500).json({ 
        error: 'Failed to search Spotify tracks',
        details: getErrorDetails(error)
      });
    }
  })
};

export default spotifyController; 