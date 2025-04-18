import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Track } from '../components/music/MusicPlayer';

// YouTube API key - same one used in MusicPlayer
const YOUTUBE_API_KEY = 'AIzaSyCoui8gnwmosPMGCGuX2cImY4SLre7JgiA';

interface Song {
  id: number;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  image_url?: string;
  url?: string;
  source?: string; // This can be any string in the Song interface
}

interface Playlist {
  id: number;
  name: string;
  description?: string;
  user_id: number;
  created_at: string;
  tracks?: any[];
}

// Helper function to extract YouTube ID from various URL formats
const extractYouTubeId = (url: string): string | undefined => {
  if (!url) return undefined;
  
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : undefined;
};

// Helper function to convert playlist tracks to our music player format
const convertToMusicPlayerTracks = (songs: Song[]): Track[] => {
  if (!songs || !Array.isArray(songs) || songs.length === 0) {
    return [];
  }
  
  return songs.map((song: Song) => ({
    id: song.id.toString(),
    title: song.title || 'Unknown Title',
    artist: song.artist || 'Unknown Artist',
    url: song.url || '',
    artwork: song.image_url || '',
    duration: song.duration || 0,
    source: 'youtube'
  }));
};

// YouTube search result interface
interface YouTubeSearchResult {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
  };
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

  const fetchPlaylistAndSongs = async () => {
    if (!id) {
      console.error('No playlist ID in URL parameters');
      setError('No playlist ID provided');
      return;
    }
    
    setIsLoading(true);
    try {
      // Check if we have a token
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        toast.error('Please log in to view playlists');
        navigate('/login');
        return;
      }

      // Log the request URL and ID type
      console.log('Fetching playlist with ID:', id, 'Type:', typeof id);
      
      // Make sure the ID is a valid number
      const playlistId = parseInt(id);
      
      if (isNaN(playlistId)) {
        throw new Error('Invalid playlist ID');
      }
      
      try {
        const playlistData = await apiService.playlists.getPlaylist(playlistId.toString());
        console.log('Raw playlist data:', playlistData);
        
        if (!playlistData) {
          throw new Error('No playlist data received');
        }
        
        setPlaylist(playlistData);
        
        if (playlistData.tracks && Array.isArray(playlistData.tracks) && playlistData.tracks.length > 0) {
          console.log('Using tracks from playlist data:', playlistData.tracks);
          
          const playlistSongs = playlistData.tracks.map((track: any) => ({
            id: track.id || Math.floor(Math.random() * 10000),
            title: track.title || 'Unknown Title',
            artist: track.artist || 'Unknown Artist',
            album: track.album,
            duration: track.duration,
            image_url: track.artwork || track.image_url,
            url: track.url,
            source: track.source || 'youtube'
          }));
          
          setSongs(playlistSongs);
          console.log('Setting songs from playlist data:', playlistSongs.length, 'songs');
        } else {
          try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/playlists/${playlistId}/songs`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              throw new Error(`Failed to fetch songs: ${response.status} ${response.statusText}`);
            }
            
            const songsData = await response.json();
            
            if (songsData && Array.isArray(songsData)) {
              const formattedSongs = songsData.map((song: any) => ({
                id: song.id,
                title: song.title || 'Unknown Title',
                artist: song.artist || 'Unknown Artist',
                album: song.album,
                duration: song.duration,
                image_url: song.image_url || song.artwork,
                url: song.url,
                source: song.source || 'youtube'
              }));
              
              setSongs(formattedSongs);
            } else {
              setSongs([]);
              toast.info('This playlist has no songs yet');
            }
          } catch (songError: any) {
            console.error('Error fetching songs:', songError);
            setSongs([]);
            toast.info('Could not fetch songs for this playlist');
          }
        }
      } catch (err: any) {
        console.error('Error fetching playlist:', err);
        
        if (err.response?.status === 401) {
          toast.error('Your session has expired. Please log in again.');
          navigate('/login');
          return;
        }
        
        throw err;
      }
    } catch (err: any) {
      console.error('Error in playlist detail page:', err);
      
      if (err.response?.status === 401) {
        toast.error('Please log in to view playlists');
        navigate('/login');
      } else if (err.response?.status === 404) {
        setError('Playlist not found');
        toast.error('This playlist does not exist');
        navigate('/playlists');
      } else {
        setError(err.message || 'Failed to load playlist');
        toast.error('Failed to load playlist: Server error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylistAndSongs();
  }, [id, navigate]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    // YouTube search
    setIsSearchingYoutube(true);
    try {
      console.log('Searching YouTube for:', searchQuery);
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(
          searchQuery
        )}&type=video&key=${YOUTUBE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('YouTube search results:', data);
      
      if (data.items && data.items.length > 0) {
        setYoutubeSearchResults(data.items);
      } else {
        toast.error('No YouTube videos found');
      }
    } catch (error) {
      console.error('Error searching YouTube:', error);
      toast.error('YouTube API error: Check your API key or search query');
    } finally {
      setIsSearchingYoutube(false);
    }
  };

  // Add a YouTube video to the playlist
  const handleAddYouTubeTrack = async (video: YouTubeSearchResult) => {
    if (!id) return;
    
    try {
      setIsAddingYoutubeTrack(true);
      
      const videoId = video.id.videoId;
      if (!videoId) {
        throw new Error('Invalid video ID');
      }
      
      const newTrack = {
        id: `yt-${videoId}`,
        title: video.snippet.title,
        artist: video.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        image_url: video.snippet.thumbnails.high.url,
        source: 'youtube',
        youtube_id: videoId
      };
      
      // Save to the backend
      const response = await apiService.playlists.addTrackToPlaylist(id, newTrack);
      console.log('Add track response:', response);
      
      toast.success(`Added "${newTrack.title}" to playlist`);
      
      // Refresh playlist data
      await fetchPlaylistAndSongs();
      
    } catch (err: any) {
      console.error('Error adding YouTube track:', err);
      toast.error(err.message || 'Failed to add track to playlist');
    } finally {
      setIsAddingYoutubeTrack(false);
      setYoutubeSearchResults([]);
      setSearchQuery('');
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
      
      // Fetch video details from YouTube API
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${youtubeId}&key=${YOUTUBE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch video details');
      }
      
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        throw new Error('Video not found');
      }
      
      const videoDetails = data.items[0];
      
      const newTrack = {
        id: `yt-${youtubeId}`,
        title: videoDetails.snippet.title,
        artist: videoDetails.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${youtubeId}`,
        image_url: videoDetails.snippet.thumbnails.high.url,
        source: 'youtube',
        youtube_id: youtubeId
      };
      
      // Save to the backend
      const apiResponse = await apiService.playlists.addTrackToPlaylist(id, newTrack);
      console.log('Add track response:', apiResponse);
      
      toast.success(`Added "${newTrack.title}" to playlist`);
      
      // Clear form and refresh playlist
      setYoutubeUrl('');
      await fetchPlaylistAndSongs();
      
    } catch (err: any) {
      console.error('Error adding YouTube URL:', err);
      toast.error(err.message || 'Failed to add track from URL');
    } finally {
      setIsAddingYoutubeTrack(false);
    }
  };

  const handleRemoveSong = async (songId: number) => {
    if (!id || !playlist) return;
    
    try {
      console.log('Removing song from playlist:', songId);
      
      // Find the song to remove
      const songIndex = songs.findIndex(s => s.id === songId);
      if (songIndex === -1) {
        toast.error('Song not found in playlist');
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
      
      // Update the playlist
      const updatedPlaylist = await apiService.playlists.updatePlaylist(id, {
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
            id: track.id || Math.floor(Math.random() * 10000),
            title: track.title || 'Unknown Title',
            artist: track.artist || 'Unknown Artist',
            album: track.album,
            duration: track.duration,
            image_url: track.artwork || track.image_url,
            url: track.url,
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
        // Extract YouTube video ID if it's a YouTube URL
        let youtubeId = '';
        if (song.url && (song.url.includes('youtube.com') || song.url.includes('youtu.be'))) {
          // Extract YouTube ID from URL
          const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
          const match = song.url.match(ytRegex);
          youtubeId = match ? match[1] : '';
        }
        
        return {
          id: song.id.toString(),
          title: song.title || 'Unknown Title',
          artist: song.artist || 'Unknown Artist',
          url: song.url || (youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : ''),
          artwork: song.image_url || '',
          duration: song.duration || 0,
          source: 'youtube' // Always set source to 'youtube' to match the Track interface
        };
      });
      
      console.log('Converted tracks:', tracks); // Debug log
      
      if (tracks.length === 0) {
        toast.error('No playable tracks found in playlist');
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
        
        return {
          id: song.id.toString(),
          title: song.title || 'Unknown Title',
          artist: song.artist || 'Unknown Artist',
          url: song.url || '',
          artwork: song.image_url || '',
          image_url: song.image_url || '',
          duration: song.duration || 0,
          source: song.source || 'youtube',
          youtube_id: youtubeId
        };
      });
      
      console.log('Formatted tracks for saving:', formattedTracks);
      
      // Keep a local copy of our songs before saving
      const localSongsCopy = [...songs];
      
      // Update the playlist with all current tracks
      const updatedPlaylist = {
        ...playlist,
        tracks: formattedTracks
      };
      
      const response = await apiService.playlists.updatePlaylist(id, updatedPlaylist);
      console.log('Save playlist response:', response);
      
      // Update the local state with the response data
      setPlaylist(response);
      
      // Check if server returned adequate track data
      if (response.tracks && Array.isArray(response.tracks) && response.tracks.length >= localSongsCopy.length) {
        // If the server returned all tracks, use the response to update songs state
        const updatedSongs = response.tracks.map((track: any) => ({
          id: track.id || Math.floor(Math.random() * 10000),
          title: track.title || 'Unknown Title',
          artist: track.artist || 'Unknown Artist',
          album: track.album,
          duration: track.duration,
          image_url: track.artwork || track.image_url || '',
          url: track.url || '',
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
              id: track.id || Math.floor(Math.random() * 10000),
              title: track.title || 'Unknown Title',
              artist: track.artist || 'Unknown Artist',
              album: track.album,
              duration: track.duration,
              image_url: track.artwork || track.image_url || '',
              url: track.url || '',
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
              disabled={!isDirty || isSaving || isLoading}
              className={`flex items-center px-4 py-2 rounded-md ${
                !isDirty || isSaving || isLoading
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
              className="flex-grow shadow appearance-none border rounded-l w-full py-1.5 px-3 bg-gray-700 text-white border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={isSearchingYoutube || !searchQuery.trim()}
              className={`font-bold py-1.5 px-4 rounded-r ${
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
        {youtubeSearchResults.length > 0 && (
          <div className="p-6 bg-gray-800 border-t border-gray-700">
            <h3 className="text-lg font-medium mb-4 text-white">YouTube Search Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {youtubeSearchResults.map((result) => (
                <div
                  key={result.id.videoId}
                  className="bg-gray-700 bg-opacity-80 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-600"
                >
                  <img
                    src={result.snippet.thumbnails.medium.url}
                    alt={result.snippet.title}
                    className="w-full h-auto rounded-t-md"
                  />
                  <div className="p-3">
                    <h4 className="font-semibold text-sm line-clamp-2 mb-1 text-white">{result.snippet.title}</h4>
                    <p className="text-xs text-gray-300 mb-2">{result.snippet.channelTitle}</p>
                    <button
                      onClick={() => handleAddYouTubeTrack(result)}
                      disabled={isAddingYoutubeTrack}
                      className={`w-full py-1.5 px-3 rounded text-sm font-medium ${
                        isAddingYoutubeTrack
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {isAddingYoutubeTrack ? 'Adding...' : 'Add to Playlist'}
                    </button>
                  </div>
                </div>
              ))}
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
                    onClick={() => handleRemoveSong(song.id)}
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