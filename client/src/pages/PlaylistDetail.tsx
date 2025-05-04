import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiService, { getApiBaseUrl } from '../services/api';
import toast from 'react-hot-toast';
import { Track } from '../components/music/MusicPlayer';
import axios from 'axios';

// Get YouTube API key from environment variable
// const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY || '';

interface Song {
  id?: string | number;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  image_url?: string;
  url?: string;
  source?: string; // This can be any string in the Song interface
}

interface Playlist {
  id: string | number;
  name: string;
  description?: string;
  cover_url?: string;
  userId: string | number;
  createdAt: string;
  updatedAt?: string;
  tracks?: any[];
}

// Helper function to extract YouTube ID from various URL formats
const extractYouTubeId = (url: string): string | undefined => {
  if (!url) return undefined;
  
  // Common patterns for YouTube URLs
  const patterns = [
    // Standard YouTube URL format
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    // Mobile YouTube URLs
    /youtube.com\/shorts\/([^"&?\/\s]{11})/i,
    // Just the ID itself (for convenience)
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return undefined;
};

// Helper function to convert YouTube duration string to seconds
const convertYoutubeDuration = (duration: string): number => {
  // If no duration or not a string, return 0
  if (!duration || typeof duration !== 'string') return 0;
  
  try {
    // YouTube duration format is typically like "PT1H2M3S" (1 hour, 2 minutes, 3 seconds)
    // or shorter versions like "PT2M3S" (2 minutes, 3 seconds) or "PT3S" (3 seconds)
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    
    // Extract hours if present
    const hoursMatch = duration.match(/(\d+)H/);
    if (hoursMatch) {
      hours = parseInt(hoursMatch[1], 10);
    }
    
    // Extract minutes if present
    const minutesMatch = duration.match(/(\d+)M/);
    if (minutesMatch) {
      minutes = parseInt(minutesMatch[1], 10);
    }
    
    // Extract seconds if present
    const secondsMatch = duration.match(/(\d+)S/);
    if (secondsMatch) {
      seconds = parseInt(secondsMatch[1], 10);
    }
    
    // Convert everything to seconds
    return (hours * 3600) + (minutes * 60) + seconds;
  } catch (error) {
    console.error('Error parsing YouTube duration:', error);
    return 0;
  }
};

// Helper function to convert playlist tracks to our music player format
const convertToMusicPlayerTracks = (songs: Song[]): Track[] => {
  if (!songs || !Array.isArray(songs) || songs.length === 0) {
    return [];
  }
  
  return songs.map((song: Song) => ({
    id: song.id ? String(song.id) : Math.random().toString(36).substring(2, 15),
    title: song.title || 'Unknown Title',
    artist: song.artist || 'Unknown Artist',
    url: song.url || '',
    artwork: song.image_url || '',
    duration: song.duration || 0,
    source: 'youtube'
  }));
};

// YouTube search result interface - with optional fields to handle both formats
interface YouTubeSearchResult {
  id: { videoId: string } | string;
  snippet?: {
    title: string;
    channelTitle: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
  };
  // Server simplified format fields
  title?: string;
  channelTitle?: string;
  thumbnail?: string;
}

const PlaylistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeSearchResults, setYoutubeSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearchingYoutube, setIsSearchingYoutube] = useState(false);
  const [isAddingYoutubeTrack, setIsAddingYoutubeTrack] = useState(false);
  const [isLoadingToPlayer, setIsLoadingToPlayer] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([]);

  // Redirect if ID is undefined
  useEffect(() => {
    if (!id) {
      console.error('No playlist ID provided');
      toast.error('No playlist ID provided');
      navigate('/playlists');
    }
  }, [id, navigate]);

  // Function to check token validity
  const checkTokenValidity = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      return false;
    }
    
    try {
      // Simple token structure check (assuming it's a JWT)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Token does not appear to be a valid JWT');
        return false;
      }
      
      // Check for token expiration if possible
      try {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && typeof payload.exp === 'number') {
          const expiryDate = new Date(payload.exp * 1000);
          const now = new Date();
          if (expiryDate < now) {
            console.error('Token has expired', expiryDate);
            return false;
          }
          console.log('Token is valid until', expiryDate);
        }
      } catch (e) {
        console.warn('Could not decode token payload', e);
      }
      
      return true;
    } catch (e) {
      console.error('Error validating token', e);
      return false;
    }
  };

  const fetchPlaylistAndSongs = async () => {
    setIsLoading(true);
    
    // Exit early if no ID is provided
    if (!id) {
      console.error('Cannot fetch playlist: No playlist ID provided');
      setError('No playlist ID provided');
      setIsLoading(false);
      return;
    }
    
    try {
      // Check token validity first
      await checkTokenValidity();

      // Get token for authorization header
      const token = localStorage.getItem('token');
      console.log('API token (first 10 chars):', token ? token.substring(0, 10) + '...' : 'No token found');
      
      if (!token) {
        toast('You need to login to view playlists', { icon: '❌' });
        navigate('/login');
        return;
      }

      // Use apiService for playlist but manual fetch for songs (with proper URL)
      try {
        // Fetch the playlist using apiService
        const playlistData = await apiService.playlists.getPlaylist(id);
        console.log('Playlist data received:', playlistData);
        
        // Set the playlist data
        setPlaylist({
          id: playlistData.id,
          name: playlistData.name,
          description: playlistData.description || '',
          cover_url: playlistData.cover_url || '',
          userId: playlistData.user_id,
          createdAt: playlistData.created_at,
          updatedAt: playlistData.updated_at
        });
        
        // Fetch the songs using correctly constructed API URL
        try {
          const baseUrl = getApiBaseUrl();
          // Construct song endpoint using the same format as the API service
          // The baseUrl already contains the domain
          const songsEndpoint = `/api/playlists/${id}/songs`;
          const songsUrl = `${baseUrl}${songsEndpoint}`;
          console.log('Fetching songs data from:', songsUrl);
          
          const response = await fetch(songsUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            console.error(`Failed to fetch songs: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error('Error response text:', errorText);
            throw new Error(`Failed to fetch songs: ${response.status}`);
          }
          
          // Check content type to ensure we're getting JSON
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.error('Error: Received non-JSON response:', contentType);
            // Get the raw text to see what was returned
            const text = await response.text();
            console.error('Raw response text (first 200 chars):', text.substring(0, 200));
            throw new Error('Server returned non-JSON response');
          }
          
          const songsData = await response.json();
          console.log('Songs data received:', songsData);
          
          if (songsData && Array.isArray(songsData)) {
            const formattedSongs = songsData.map((song: any) => ({
              id: song.id || undefined,
              title: song.title || 'Unknown Title',
              artist: song.artist || 'Unknown Artist',
              album: song.album,
              duration: song.duration,
              image_url: song.image_url || song.artwork || song.cover_url || '',
              url: song.url || song.audio_url || '',
              source: song.source || 'youtube'
            }));
            
            setSongs(formattedSongs);
          } else {
            setSongs([]);
            toast('This playlist has no songs yet', { icon: 'ℹ️' });
          }
        } catch (songError: any) {
          console.error('Error fetching songs:', songError);
          setSongs([]);
          toast('Could not fetch songs for this playlist', { icon: '❌' });
        }
        
        // Reset dirty state after loading
        setIsDirty(false);
      } catch (err: any) {
        console.error('Error fetching playlist:', err);
        
        if (err.response?.status === 401) {
          toast.error('Your session has expired. Please log in again.');
          navigate('/login');
        } else if (err.response?.status === 404) {
          setError('Playlist not found');
          toast.error('This playlist does not exist');
          navigate('/playlists');
        } else {
          setError(err.message || 'Failed to load playlist');
          toast.error('Failed to load playlist: Server error');
        }
      }
    } catch (err: any) {
      console.error('Error in fetchPlaylistAndSongs:', err);
      setError('Failed to load playlist data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPlaylistAndSongs();
    }
  }, [id, navigate]);

  const searchYouTube = async (query: string) => {
    setIsSearchingYoutube(true);
    try {
      console.log('Searching YouTube for:', query);
      
      // Use the proper API base URL without doubling the /api/ prefix
      const baseUrl = getApiBaseUrl();
      let apiUrl = `${baseUrl}/api/youtube/search`;
      console.log('YouTube search API URL:', apiUrl);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      try {
        // Using a more detailed error handler to see what's happening
        const response = await axios.get(apiUrl, {
          params: { query },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        });
        
        console.log('YouTube search response status:', response.status);
        console.log('YouTube search response data:', response.data);
        
        // Process the response
        processYoutubeResponse(response.data);
      } catch (error: any) {
        console.error('Error with first YouTube search attempt:', error);
        
        // If the first approach fails, try the direct YouTube API (if that's what works in the music player)
        if (process.env.REACT_APP_YOUTUBE_API_KEY) {
          try {
            console.log('Attempting direct YouTube API search as fallback');
            const ytResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
              params: {
                part: 'snippet',
                maxResults: 25,
                q: query,
                type: 'video',
                key: process.env.REACT_APP_YOUTUBE_API_KEY
              }
            });
            
            console.log('Direct YouTube API response:', ytResponse.data);
            // Convert to our expected format
            const formattedResults = ytResponse.data.items.map((item: any) => ({
              id: { videoId: item.id.videoId },
              snippet: item.snippet
            }));
            setYoutubeSearchResults(formattedResults);
            setSearchError(null);
          } catch (fallbackError: any) {
            console.error('Error with direct YouTube API fallback:', fallbackError);
            throw fallbackError;
          }
        } else {
          // Rethrow the error if we don't have a fallback
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Error searching YouTube:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('YouTube search error response:', error.response.status, error.response.data);
        
        if (error.response.status === 401) {
          setSearchError('Your session has expired. Please log in again.');
          localStorage.removeItem('token');
          toast('Session expired. Please log in again.', { icon: '❌' });
          setTimeout(() => navigate('/login?expired=true'), 2000);
        } else if (error.response.status === 500) {
          setSearchError(`Server error: ${error.response.data?.message || 'Unknown server error'}`);
          toast(`YouTube search failed: ${error.response.data?.message || 'Server error'}`, { icon: '❌' });
        } else {
          setSearchError(`Error searching YouTube: ${error.response.data?.message || error.message}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from YouTube search API', error.request);
        setSearchError('No response from server. Please try again later.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('YouTube search request setup error:', error.message);
        setSearchError(`Error setting up search: ${error.message}`);
      }
      
      setYoutubeSearchResults([]);
    } finally {
      setIsSearchingYoutube(false);
    }
  };
  
  // Helper function to process YouTube response data
  const processYoutubeResponse = (data: any) => {
    // Ensure the response is array-like before setting it
    if (data && Array.isArray(data.items)) {
      // This is the standard YouTube API response format
      setYoutubeSearchResults(data.items);
      console.log('YouTube search results count:', data.items.length);
    } else if (data && Array.isArray(data)) {
      // This is the server's simplified format - convert it to the format we expect
      const formattedResults = data.map((item: any) => {
        // Check if the data is already in the expected format
        if (item.snippet && item.id && item.id.videoId) {
          return item;
        }
        
        // If it's the server's simplified format, convert it
        return {
          id: { videoId: item.id },
          snippet: {
            title: item.title,
            channelTitle: item.channelTitle,
            thumbnails: {
              default: { url: item.thumbnail },
              medium: { url: item.thumbnail },
              high: { url: item.thumbnail }
            }
          }
        };
      });
      
      setYoutubeSearchResults(formattedResults);
      console.log('YouTube search results count:', formattedResults.length);
    } else {
      console.error('YouTube search returned non-array response:', data);
      setYoutubeSearchResults([]);
      setSearchError('Invalid response format from YouTube API');
    }
  };

  const getVideoDetails = async (youtubeId: string) => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const apiUrl = `${baseUrl}/api/youtube/video/${youtubeId}`;
      console.log('Getting video details from:', apiUrl);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      return response.data;
    } catch (err) {
      console.error('Error getting video details:', err);
      return null;
    }
  };

  // Add a YouTube video to the playlist
  const handleAddYouTubeTrack = async (video: YouTubeSearchResult) => {
    setIsLoading(true);
    try {
      // Extract videoId safely
      const videoId = typeof video.id === 'string' ? video.id : video.id.videoId;
      
      // Get the best available thumbnail URL
      const thumbnailUrl = video.snippet?.thumbnails?.high?.url || 
                          video.snippet?.thumbnails?.medium?.url || 
                          video.snippet?.thumbnails?.default?.url || 
                          video.thumbnail ||
                          '';
                          
      // Create a song object from the YouTube video
      const song = {
        // Add a temporary ID for TypeScript compatibility
        id: `temp-${videoId}`,
        title: video.snippet?.title || video.title || '',
        artist: video.snippet?.channelTitle || video.channelTitle || '',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        image_url: thumbnailUrl,
        duration: 0, // YouTube search doesn't provide duration
        audio_url: `https://www.youtube.com/watch?v=${videoId}`,
        cover_url: thumbnailUrl,
        source: 'youtube', // Add source property required by Track interface
        youtube_id: videoId // Pass YouTube ID directly
      };
      
      // Ensure id is a string
      const playlistId = id || '';
      const response = await apiService.playlists.addTrackToPlaylist(playlistId, song);
      console.log('Add track response:', response);
      
      toast.success('Song added to playlist');
      
      // Refresh playlist data
      await fetchPlaylistAndSongs();
      
      // Mark the playlist as dirty
      setIsDirty(true);
      
    } catch (err: any) {
      console.error('Error adding YouTube track:', err);
      toast.error('Failed to add track to playlist');
    } finally {
      setIsAddingYoutubeTrack(false);
      setYoutubeSearchResults([]);
      setSearchQuery('');
      setIsLoading(false);
    }
  };

  // Handle adding YouTube URL directly
  const handleAddYoutubeUrl = async () => {
    if (!id) return;
    
    try {
      setIsAddingYoutubeTrack(true);
      
      const youtubeId = extractYouTubeId(youtubeUrl);
      if (!youtubeId) {
        throw new Error('Invalid YouTube URL');
      }
      
      // Fetch video details from YouTube API - using axios instead of fetch
      const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet',
          id: youtubeId,
          key: process.env.REACT_APP_YOUTUBE_API_KEY
        }
      });
      
      const data = response.data;
      
      if (!data.items || data.items.length === 0) {
        throw new Error('Video not found');
      }
      
      const videoDetails = data.items[0];
      
      // Get the best available thumbnail URL
      const thumbnailUrl = videoDetails.snippet.thumbnails.high?.url || 
                          videoDetails.snippet.thumbnails.medium?.url || 
                          videoDetails.snippet.thumbnails.default?.url || 
                          '';
      
      const newTrack = {
        // Add a temporary ID for TypeScript compatibility
        id: `temp-${youtubeId}`,
        title: videoDetails.snippet.title,
        artist: videoDetails.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${youtubeId}`,
        image_url: thumbnailUrl,
        source: 'youtube',
        youtube_id: youtubeId
      };
      
      // Save to the backend - ensure id is a string
      const playlistId = id || '';
      const apiResponse = await apiService.playlists.addTrackToPlaylist(playlistId, newTrack);
      console.log('Add track response:', apiResponse);
      
      toast.success('Song added to playlist');
      
      // Clear form and refresh playlist
      setYoutubeUrl('');
      await fetchPlaylistAndSongs();
      
      // Mark the playlist as dirty
      setIsDirty(true);
      
    } catch (err: any) {
      console.error('Error adding YouTube URL:', err);
      toast.error('Failed to add track from URL');
    } finally {
      setIsAddingYoutubeTrack(false);
    }
  };

  const handleRemoveSong = async (songId: number | string | undefined) => {
    if (!id || !playlist || songId === undefined) return;
    
    try {
      console.log('Removing song from playlist:', songId);
      
      // Find the song to remove
      const songIndex = songs.findIndex(s => s.id === songId);
      if (songIndex === -1) {
        toast('Song not found in playlist', { icon: 'ℹ️' });
        return;
      }
      
      // Create a copy of the current songs and remove the one at the found index
      const updatedSongs = [...songs];
      updatedSongs.splice(songIndex, 1);
      
      // Optimistically update the UI
      setSongs(updatedSongs);
      
      // Create updated tracks array for the API
      const currentTracks = [...(playlist.tracks || [])];
      currentTracks.splice(songIndex, 1);
      
      // Update the playlist - ensure id is a string
      const playlistId = id || '';
      const updatedPlaylist = await apiService.playlists.updatePlaylist(playlistId, {
        ...playlist,
        tracks: currentTracks
      });
      
      // Update the playlist in state with the response
      setPlaylist(updatedPlaylist);
      
      toast.success('Song removed from playlist');
      
      // Mark the playlist as dirty
      setIsDirty(true);
    } catch (err: any) {
      console.error('Error removing song:', err);
      toast.error('Failed to remove song from playlist');
      
      // Refetch the playlist to ensure UI is in sync with server
      try {
        const refreshedPlaylist = await apiService.playlists.getPlaylist(id);
        setPlaylist(refreshedPlaylist);
        
        if (refreshedPlaylist.tracks && Array.isArray(refreshedPlaylist.tracks)) {
          const refreshedSongs = refreshedPlaylist.tracks.map((track: any) => ({
            id: track.id || undefined,
            title: track.title || 'Unknown Title',
            artist: track.artist || 'Unknown Artist',
            album: track.album,
            duration: track.duration,
            image_url: track.artwork || track.image_url || track.cover_url || '',
            url: track.url || track.audio_url || '',
            source: track.source || 'youtube'
          }));
          
          setSongs(refreshedSongs);
        }
      } catch (refreshError) {
        console.error('Error refreshing playlist after failed remove:', refreshError);
      }
    }
  };

  const handlePlayInMusicPlayer = () => {
    if (!playlist) return;
    
    setIsLoadingToPlayer(true);
    try {
      console.log('Converting playlist songs to music player format...'); // Debug log
      
      // We'll use the songs state directly, which already has the songs from the API
      const tracks: Track[] = songs.map(song => {
        // Handle both field naming conventions (database vs client)
        const songUrl = song.url || (song as any).audio_url || '';
        const songImage = song.image_url || (song as any).cover_url || '';
        
        // Extract YouTube video ID if it's a YouTube URL
        let youtubeId = '';
        if (songUrl && (songUrl.includes('youtube.com') || songUrl.includes('youtu.be'))) {
          // Extract YouTube ID from URL
          const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
          const match = songUrl.match(ytRegex);
          youtubeId = match ? match[1] : '';
        }
        
        // Convert to the format expected by the music player
        return {
          id: song.id ? song.id.toString() : Math.random().toString(36).substring(2, 15),
          title: song.title || 'Unknown Title',
          artist: song.artist || 'Unknown Artist',
          url: songUrl || (youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : ''),
          artwork: songImage || '',
          duration: song.duration || 0,
          source: 'youtube' // Always set source to 'youtube' to match the Track interface
        };
      });
      
      console.log('Converted tracks:', tracks); // Debug log
      
      if (tracks.length === 0) {
        toast('No playable tracks found in playlist', { icon: 'ℹ️' });
        setIsLoadingToPlayer(false);
        return;
      }
      
      // First clear any existing playlist to avoid mixing tracks
      localStorage.removeItem('vibeflo_playlist');
      localStorage.removeItem('vibeflo_current_track');
      
      // Store the tracks in localStorage so the music player can access them
      localStorage.setItem('vibeflo_playlist', JSON.stringify(tracks));
      
      // Set the first track as the current track
      localStorage.setItem('vibeflo_current_track', JSON.stringify(tracks[0]));
      
      // Force a refresh of the music player by setting a timestamp
      localStorage.setItem('vibeflo_playlist_updated', Date.now().toString());
      
      // Force the music player to stay open
      localStorage.setItem('vibeflo_player_open', 'true');
      
      // Create and dispatch a custom event to notify the music player
      const playlistEvent = new CustomEvent('vibeflo_playlist_loaded', { 
        detail: { tracks, currentTrack: tracks[0], keepOpen: true }
      });
      window.dispatchEvent(playlistEvent);
      
      // Notify user
      toast.success('Playlist loaded to music player');
      
      // Simply mark loading as complete - no navigation needed
      setIsLoadingToPlayer(false);
    } catch (error) {
      console.error('Error preparing playlist for music player:', error);
      toast.error('Failed to load playlist to music player');
      setIsLoadingToPlayer(false);
    }
  };

  // Save the current playlist
  const handleSavePlaylist = async () => {
    if (!playlist || !id) return;
    
    setIsSaving(true);
    try {
      console.log('Saving playlist:', { id, name: playlist.name, songs });
      
      // Format the songs as tracks for saving
      const formattedTracks = songs.map(song => {
        // Extract YouTube ID from URL if not already present
        let youtubeId = '';
        if (song.url && (song.url.includes('youtube.com') || song.url.includes('youtu.be'))) {
          youtubeId = extractYouTubeId(song.url || '') || '';
        }
        
        // For track ID, check if it's a valid UUID
        // Only include the ID if it's a properly formatted UUID
        const songIdStr = String(song.id || '');
        
        // UUID validation regex pattern
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const isValidUuid = uuidPattern.test(songIdStr);
        
        // Only include ID if it's a valid UUID
        const trackData: any = {
          title: song.title || 'Unknown Title',
          artist: song.artist || 'Unknown Artist',
          album: song.album || '',
          url: song.url || '',
          artwork: song.image_url || '',
          image_url: song.image_url || '',
          cover_url: song.image_url || '', // Add cover_url too for compatibility
          audio_url: song.url || '', // Add audio_url for compatibility
          duration: song.duration || 0,
          source: song.source || 'youtube',
          youtube_id: youtubeId
        };
        
        // Only add ID if it's a valid UUID
        if (isValidUuid) {
          trackData.id = songIdStr;
        }
        
        return trackData;
      });
      
      console.log('Formatted tracks for saving:', formattedTracks);
      
      // Keep a local copy of our songs before saving
      const localSongsCopy = [...songs];
      
      // Update the playlist with all current tracks
      const updatedPlaylist = {
        ...playlist,
        tracks: formattedTracks
      };
      
      // Ensure id is a string
      const playlistId = id || '';
      const response = await apiService.playlists.updatePlaylist(playlistId, updatedPlaylist);
      console.log('Save playlist response:', response);
      
      // Update the local state with the response data
      setPlaylist(response);
      
      // Check if server returned adequate track data
      if (response.tracks && Array.isArray(response.tracks) && response.tracks.length >= localSongsCopy.length) {
        // If the server returned all tracks, use the response to update songs state
        const updatedSongs = response.tracks.map((track: any) => ({
          id: track.id || undefined,
          title: track.title || 'Unknown Title',
          artist: track.artist || 'Unknown Artist',
          album: track.album || '',
          duration: track.duration || 0,
          image_url: track.artwork || track.image_url || track.cover_url || '',
          url: track.url || track.audio_url || '',
          source: track.source || 'youtube'
        }));
        
        setSongs(updatedSongs);
        console.log('Updated songs state with server response tracks:', updatedSongs);
      } else {
        // If server returned fewer tracks than we have locally (or none), 
        // try to fetch the full playlist first
        console.log('Server returned incomplete track data. Attempting to refresh...');
        
        try {
          console.log('Fetching updated playlist from API...');
          const refreshedPlaylist = await apiService.playlists.getPlaylist(id);
          
          if (refreshedPlaylist.tracks && Array.isArray(refreshedPlaylist.tracks) && 
              refreshedPlaylist.tracks.length >= localSongsCopy.length) {
            // If we got a complete response, use it
            const refreshedSongs = refreshedPlaylist.tracks.map((track: any) => ({
              id: track.id || undefined,
              title: track.title || 'Unknown Title',
              artist: track.artist || 'Unknown Artist',
              album: track.album || '',
              duration: track.duration || 0,
              image_url: track.artwork || track.image_url || track.cover_url || '',
              url: track.url || track.audio_url || '',
              source: track.source || 'youtube'
            }));
            
            setSongs(refreshedSongs);
            console.log('Updated songs state with refreshed tracks:', refreshedSongs);
          } else {
            // If the server still returns incomplete data, keep using our local state
            console.log('Server still returned incomplete data. Using local songs state.');
            // Keep the local songs - they are more complete than what the server returned
            
            // However, update IDs if possible to match server IDs
            if (refreshedPlaylist.tracks && Array.isArray(refreshedPlaylist.tracks)) {
              const serverTracks = refreshedPlaylist.tracks;
              // Create a lookup of server tracks by title+artist to match with local tracks
              const serverTrackMap = new Map();
              serverTracks.forEach((track: any) => {
                const key = `${track.title}:${track.artist}`;
                serverTrackMap.set(key, track);
              });
              
              // Update local tracks with server IDs where possible
              const updatedLocalSongs = localSongsCopy.map(song => {
                const key = `${song.title}:${song.artist}`;
                const serverTrack = serverTrackMap.get(key);
                if (serverTrack && serverTrack.id) {
                  return {
                    ...song,
                    id: serverTrack.id
                  };
                }
                return song;
              });
              
              setSongs(updatedLocalSongs);
              console.log('Updated local songs with server IDs where possible:', updatedLocalSongs);
            }
          }
        } catch (refreshError) {
          console.error('Error refreshing playlist after save:', refreshError);
          // Keep using the local songs state since that's our source of truth
          console.log('Using local songs as source of truth');
        }
      }
      
      setIsDirty(false);
      // Display a clear toast notification with the playlist name
      toast.success('Playlist saved successfully');
    } catch (error) {
      console.error('Error saving playlist:', error);
      toast.error('Failed to save playlist');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter a search term');
      return;
    }
    
    // The searchYouTube function already handles all the loading state and errors
    // so we just need to call it directly
    await searchYouTube(searchQuery);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" role="status" />
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-900/70 border border-red-500 text-white px-4 py-3 rounded-lg shadow-lg relative" role="alert">
          <span className="block sm:inline">Playlist not found</span>
        </div>
        <div className="mt-4">
          <Link to="/playlists" className="text-purple-300 hover:text-white">
            &larr; Back to Playlists
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/playlists" className="flex items-center text-purple-300 hover:text-white font-medium text-lg">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Playlists
        </Link>
      </div>
      
      {playlist && (
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">{playlist.name}</h1>
            {playlist.description && <p className="text-white text-lg">{playlist.description}</p>}
          </div>
          
          <div className="flex space-x-3">
            {/* Save button */}
            <button
              onClick={handleSavePlaylist}
              disabled={isSaving || isLoading}
              className={`flex items-center px-4 py-2 rounded-md ${
                isSaving || isLoading
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h1a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h1v5.586l-1.293-1.293zM9 4a1 1 0 112 0v2H9V4z" />
                  </svg>
                  Save Playlist
                </>
              )}
            </button>
            
            {/* Play in Music Player button */}
            <button
              onClick={handlePlayInMusicPlayer}
              disabled={!songs || songs.length === 0 || isLoadingToPlayer}
              className={`flex items-center px-4 py-2 rounded-md ${
                !songs || songs.length === 0 || isLoadingToPlayer
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isLoadingToPlayer ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Play in Music Player
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/70 border border-red-500 text-white px-4 py-3 rounded-lg shadow-lg relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="bg-gray-800 bg-opacity-80 shadow-lg rounded-lg mb-6 overflow-hidden">
        <div className="px-6 py-4 bg-gray-700 bg-opacity-80 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Add YouTube Videos</h2>
        </div>
        
        {/* Direct YouTube URL input */}
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-medium mb-2 text-white">Add by YouTube URL</h3>
          <div className="flex">
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Paste YouTube URL here..."
              className="flex-grow shadow appearance-none border rounded-l w-full py-2 px-3 bg-gray-700 text-white border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddYoutubeUrl()}
            />
            <button
              onClick={handleAddYoutubeUrl}
              disabled={isAddingYoutubeTrack || !youtubeUrl.trim()}
              className={`font-bold py-2 px-4 rounded-r ${
                isAddingYoutubeTrack || !youtubeUrl.trim()
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isAddingYoutubeTrack ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
        
        {/* Search input */}
        <div className="p-6">
          <h3 className="text-lg font-medium mb-2 text-white">Search YouTube</h3>
          <div className="flex max-w-2xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search YouTube..."
              className="flex-grow shadow appearance-none border rounded-l w-full py-2 px-3 bg-gray-700 text-white border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={isSearchingYoutube || !searchQuery.trim()}
              className={`font-bold py-2 px-4 rounded-r ${
                isSearchingYoutube || !searchQuery.trim()
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isSearchingYoutube ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </div>
              ) : 'Search YouTube'}
            </button>
          </div>
        </div>
        
        {/* YouTube Search Results */}
        {Array.isArray(youtubeSearchResults) && youtubeSearchResults.length > 0 && (
          <div className="p-6 bg-gray-800 border-t border-gray-700">
            <h3 className="text-lg font-medium mb-4 text-white">YouTube Search Results</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {youtubeSearchResults.map((result) => {
                // Safe access to videoId (handles both formats)
                const videoId = typeof result.id === 'string' ? result.id : result.id.videoId;
                
                // Safe access to thumbnail URL - prioritize higher quality images
                const thumbnailUrl = 
                  result.snippet?.thumbnails?.high?.url || 
                  result.snippet?.thumbnails?.medium?.url || 
                  result.snippet?.thumbnails?.default?.url || 
                  result.thumbnail || 
                  'https://via.placeholder.com/480x360?text=No+Thumbnail';
                
                // Safe access to title and channel
                const title = result.snippet?.title || result.title || 'Unknown Title';
                const channelTitle = result.snippet?.channelTitle || result.channelTitle || 'Unknown Channel';
                
                return (
                  <div
                    key={videoId}
                    className="bg-gray-700 bg-opacity-80 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-600 hover:border-purple-500 flex flex-col"
                  >
                    <div className="relative pt-[100%] w-full"> {/* This creates a square aspect ratio */}
                      <img
                        src={thumbnailUrl}
                        alt={title}
                        className="absolute top-0 left-0 w-full h-full object-cover rounded-t-md"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback if image fails to load
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/480x360?text=No+Thumbnail';
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-xs text-gray-300 truncate">{channelTitle}</p>
                      </div>
                    </div>
                    
                    <div className="p-3 flex-grow flex flex-col justify-between">
                      <h4 className="font-semibold text-sm line-clamp-2 mb-2 text-white h-10">{title}</h4>
                      <button
                        onClick={() => handleAddYouTubeTrack({
                          id: { videoId },
                          snippet: {
                            title,
                            channelTitle,
                            description: result.snippet?.description || '',
                            thumbnails: {
                              default: { url: thumbnailUrl, width: 120, height: 90 },
                              medium: { url: thumbnailUrl, width: 320, height: 180 },
                              high: { url: thumbnailUrl, width: 480, height: 360 }
                            }
                          }
                        })}
                        disabled={isAddingYoutubeTrack}
                        className={`w-full py-1.5 px-2 rounded text-sm font-medium ${
                          isAddingYoutubeTrack
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        {isAddingYoutubeTrack ? 'Adding...' : 'Add to Playlist'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-gray-800 bg-opacity-80 shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-700 bg-opacity-80 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">
            Songs in Playlist
          </h3>
          <span className="text-sm bg-purple-600 text-white px-2 py-1 rounded-full">{songs.length} {songs.length !== 1 ? 'songs' : 'song'}</span>
        </div>
        
        {songs.length === 0 ? (
          <div className="p-8 text-center text-gray-300">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-lg">No songs in this playlist yet.</p>
            <p className="mt-2">Search for YouTube videos or paste URLs to add songs.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-700">
            {songs.map((song) => (
              <li key={song.id} className="px-6 py-4 hover:bg-gray-700 transition-colors duration-150 flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  {song.image_url && (
                    <img src={song.image_url} alt={song.title} className="h-12 w-12 rounded-md mr-4 object-cover shadow-sm" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{song.title}</div>
                    <div className="text-sm text-gray-300 truncate">{song.artist} {song.album ? `• ${song.album}` : ''}</div>
                  </div>
                </div>
                <div className="flex items-center ml-4">
                  <span className="text-sm text-gray-300 mr-4 whitespace-nowrap">{formatDuration(song.duration)}</span>
                  <button
                    onClick={() => song.id !== undefined && handleRemoveSong(song.id)}
                    className="text-red-300 hover:text-red-100 transition-colors duration-150 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetail; 