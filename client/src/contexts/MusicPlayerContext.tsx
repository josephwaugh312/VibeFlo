import React, { createContext, useContext, useState, useRef, useEffect, FormEvent } from 'react';
import { Track } from '../components/music/MusicPlayer';
import { playlistAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import axios from 'axios';

type PlayerTab = 'nowPlaying' | 'playlist' | 'search';

interface MusicPlayerContextType {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isOpen: boolean;
  isMinimized: boolean;
  currentTab: PlayerTab;
  searchQuery: string;
  searchResults: any[];
  isSearching: boolean;
  addTrack: (track: Track) => void;
  removeTrack: (trackId: string) => void;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  playPrevious: () => void;
  playNext: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleOpen: () => void;
  toggleMinimize: () => void;
  setCurrentTab: (tab: PlayerTab) => void;
  setSearchQuery: (query: string) => void;
  handleSearch: (e: FormEvent) => Promise<void>;
  savePlaylistToAccount: (playlistName: string) => Promise<void>;
  setPlayerReference: (player: any) => void;
}

export const MusicPlayerContext = createContext<MusicPlayerContextType>({
  tracks: [],
  currentTrack: null,
  isPlaying: false,
  volume: 50,
  currentTime: 0,
  duration: 0,
  isOpen: false,
  isMinimized: false,
  currentTab: 'nowPlaying',
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  addTrack: () => {},
  removeTrack: () => {},
  playTrack: () => {},
  togglePlay: () => {},
  play: () => {},
  pause: () => {},
  playPrevious: () => {},
  playNext: () => {},
  seek: () => {},
  setVolume: () => {},
  toggleOpen: () => {},
  toggleMinimize: () => {},
  setCurrentTab: () => {},
  setSearchQuery: () => {},
  handleSearch: async () => {},
  savePlaylistToAccount: async () => {},
  setPlayerReference: () => {}
});

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentTab, setCurrentTab] = useState<PlayerTab>('nowPlaying');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const playerRef = useRef<any>(null);
  
  // Get YouTube API key from environment variable
  const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY || '';
  
  // Mock data for fallback when YouTube API fails
  const mockSearchResults = [
    {
      id: { videoId: 'dQw4w9WgXcQ' },
      snippet: {
        title: 'Rick Astley - Never Gonna Give You Up',
        channelTitle: 'Rick Astley',
        thumbnails: {
          default: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg' },
          high: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' }
        }
      }
    },
    {
      id: { videoId: 'y6120QOlsfU' },
      snippet: {
        title: 'Darude - Sandstorm',
        channelTitle: 'Darude',
        thumbnails: {
          default: { url: 'https://i.ytimg.com/vi/y6120QOlsfU/default.jpg' },
          high: { url: 'https://i.ytimg.com/vi/y6120QOlsfU/hqdefault.jpg' }
        }
      }
    },
    {
      id: { videoId: 'CevxZvSJLk8' },
      snippet: {
        title: 'Katy Perry - Roar',
        channelTitle: 'Katy Perry',
        thumbnails: {
          default: { url: 'https://i.ytimg.com/vi/CevxZvSJLk8/default.jpg' },
          high: { url: 'https://i.ytimg.com/vi/CevxZvSJLk8/hqdefault.jpg' }
        }
      }
    }
  ];

  // Load tracks and current track from localStorage
  useEffect(() => {
    const storedTracks = localStorage.getItem('vibeflo_playlist');
    const storedCurrentTrack = localStorage.getItem('vibeflo_current_track');
    
    if (storedTracks) {
      setTracks(JSON.parse(storedTracks));
    }
    
    if (storedCurrentTrack) {
      setCurrentTrack(JSON.parse(storedCurrentTrack));
    }
    
    // Listen for playlist updates across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vibeflo_playlist') {
        const newTracks = e.newValue ? JSON.parse(e.newValue) : [];
        setTracks(newTracks);
      }
      if (e.key === 'vibeflo_current_track') {
        const newTrack = e.newValue ? JSON.parse(e.newValue) : null;
        setCurrentTrack(newTrack);
      }
      if (e.key === 'vibeflo_playlist_updated') {
        // Reload playlist from localStorage
        const refreshedTracks = localStorage.getItem('vibeflo_playlist');
        const refreshedCurrentTrack = localStorage.getItem('vibeflo_current_track');
        
        if (refreshedTracks) {
          const parsedTracks = JSON.parse(refreshedTracks);
          setTracks(parsedTracks);
          console.log('Music player refreshed with playlist:', parsedTracks);
        }
        
        if (refreshedCurrentTrack) {
          const parsedCurrentTrack = JSON.parse(refreshedCurrentTrack);
          setCurrentTrack(parsedCurrentTrack);
          setIsPlaying(true);
          setIsOpen(true);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for the playlist_updated flag in this window
  useEffect(() => {
    const checkPlaylistUpdated = () => {
      const updated = localStorage.getItem('vibeflo_playlist_updated');
      if (updated) {
        // Clear the flag
        localStorage.removeItem('vibeflo_playlist_updated');
        
        // Reload playlist from localStorage
        const refreshedTracks = localStorage.getItem('vibeflo_playlist');
        const refreshedCurrentTrack = localStorage.getItem('vibeflo_current_track');
        
        if (refreshedTracks) {
          const parsedTracks = JSON.parse(refreshedTracks);
          setTracks(parsedTracks);
          console.log('Music player refreshed with playlist:', parsedTracks);
        }
        
        if (refreshedCurrentTrack) {
          const parsedCurrentTrack = JSON.parse(refreshedCurrentTrack);
          setCurrentTrack(parsedCurrentTrack);
          setIsPlaying(true);
          setIsOpen(true);
        }
      }
    };
    
    // Check immediately on component mount
    checkPlaylistUpdated();
    
    // Also set an interval to check periodically (for race conditions)
    const intervalId = setInterval(checkPlaylistUpdated, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Listen for custom events to load a playlist
  useEffect(() => {
    const handlePlaylistLoaded = (e: any) => {
      try {
        const { tracks, currentTrack, keepOpen } = e.detail;
        console.log('Playlist loaded via custom event:', tracks);
        
        if (tracks && Array.isArray(tracks)) {
          setTracks(tracks);
          
          if (currentTrack) {
            setCurrentTrack(currentTrack);
            setIsPlaying(true);
            
            // When keepOpen is true, ensure player stays visible
            if (keepOpen) {
              setIsOpen(true);
              setIsMinimized(false);
              localStorage.setItem('vibeflo_player_open', 'true');
            } else {
              setIsOpen(true);
            }
            
            // Force play attempt if we have a global player instance
            if (playerRef.current) {
              setTimeout(() => {
                console.log('Attempting to play track immediately after load');
                try {
                  playerRef.current.playVideo();
                } catch (err) {
                  console.error('Error auto-playing after load:', err);
                }
              }, 300);
            }
          }
        } else {
          // Make sure we handle non-array tracks case explicitly 
          console.error('Error handling custom playlist event: Invalid tracks format', e.detail);
        }
      } catch (err) {
        console.error('Error handling custom playlist event:', err);
      }
    };
    
    window.addEventListener('vibeflo_playlist_loaded', handlePlaylistLoaded);
    return () => window.removeEventListener('vibeflo_playlist_loaded', handlePlaylistLoaded);
  }, []);

  // Add a track to the playlist
  const addTrack = (track: Track) => {
    const updatedTracks = [...tracks, track];
    setTracks(updatedTracks);
    localStorage.setItem('vibeflo_playlist', JSON.stringify(updatedTracks));
    
    if (!currentTrack) {
      setCurrentTrack(track);
      localStorage.setItem('vibeflo_current_track', JSON.stringify(track));
    }
    
    toast.success(`Added "${track.title.slice(0, 30)}${track.title.length > 30 ? '...' : ''}" to playlist`);
  };

  // Remove a track from the playlist
  const removeTrack = (trackId: string) => {
    const trackToRemove = tracks.find(track => track.id === trackId);
    const updatedTracks = tracks.filter(track => track.id !== trackId);
    setTracks(updatedTracks);
    localStorage.setItem('vibeflo_playlist', JSON.stringify(updatedTracks));
    
    if (currentTrack?.id === trackId) {
      if (updatedTracks.length > 0) {
        setCurrentTrack(updatedTracks[0]);
        localStorage.setItem('vibeflo_current_track', JSON.stringify(updatedTracks[0]));
      } else {
        setCurrentTrack(null);
        localStorage.removeItem('vibeflo_current_track');
      }
    }
    
    if (trackToRemove) {
      toast.success(`Removed "${trackToRemove.title.slice(0, 30)}${trackToRemove.title.length > 30 ? '...' : ''}" from playlist`);
    } else {
      toast.success('Track removed from playlist');
    }
  };

  // Play a specific track
  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    localStorage.setItem('vibeflo_current_track', JSON.stringify(track));
    setIsPlaying(true);
    setCurrentTab('nowPlaying');
    
    // Don't show toast for every track change to avoid notification overload
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  // Play the current track
  const play = () => {
    if (!currentTrack) return;
    setIsPlaying(true);
    
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      try {
        playerRef.current.playVideo();
        
        // Only show toast on manual play, not auto-play
        const truncatedTitle = currentTrack.title.length > 30 
          ? `${currentTrack.title.slice(0, 30)}...` 
          : currentTrack.title;
        toast.success(`Playing: ${truncatedTitle}`, { 
          id: 'play-status',  // Using ID prevents multiple toasts when clicking play repeatedly
          duration: 1500      // Shorter duration for playback toasts
        });
      } catch (err) {
        console.error("Error playing video:", err);
      }
    } else {
      console.log("Player not ready yet, retrying in 500ms");
      // Retry after short delay
      setTimeout(() => {
        if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
          try {
            playerRef.current.playVideo();
          } catch (err) {
            console.error("Error playing video on retry:", err);
          }
        }
      }, 500);
    }
  };

  // Pause the current track
  const pause = () => {
    setIsPlaying(false);
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      try {
        playerRef.current.pauseVideo();
        
        if (currentTrack) {
          toast.success('Paused', { 
            id: 'play-status',  // Using same ID as play toast
            duration: 1500      // Shorter duration
          });
        }
      } catch (err) {
        console.error("Error pausing video:", err);
      }
    }
  };

  // Play the previous track
  const playPrevious = () => {
    if (!currentTrack || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(track => track.id === currentTrack.id);
    const previousIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    const previousTrack = tracks[previousIndex];
    
    setCurrentTrack(previousTrack);
    localStorage.setItem('vibeflo_current_track', JSON.stringify(previousTrack));
    
    // Ensure we're playing
    setIsPlaying(true);
    
    // The actual playing will be handled by the useEffect that watches currentTrack
    
    const truncatedTitle = previousTrack.title.length > 30 
      ? `${previousTrack.title.slice(0, 30)}...` 
      : previousTrack.title;
    toast.success(`Playing previous: ${truncatedTitle}`, {
      id: 'play-status',
      duration: 1500
    });
  };

  // Play the next track
  const playNext = () => {
    if (!currentTrack || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(track => track.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    const nextTrack = tracks[nextIndex];
    
    setCurrentTrack(nextTrack);
    localStorage.setItem('vibeflo_current_track', JSON.stringify(nextTrack));
    
    // Ensure we're playing
    setIsPlaying(true);
    
    // The actual playing will be handled by the useEffect that watches currentTrack
    
    const truncatedTitle = nextTrack.title.length > 30 
      ? `${nextTrack.title.slice(0, 30)}...` 
      : nextTrack.title;
    toast.success(`Playing next: ${truncatedTitle}`, {
      id: 'play-status',
      duration: 1500
    });
  };

  // Seek to a specific time in the current track
  const seek = (time: number) => {
    if (currentTrack && playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try {
        playerRef.current.seekTo(time);
      } catch (err) {
        console.error("Error seeking:", err);
      }
    }
  };

  // Toggle the player's open state
  const toggleOpen = () => {
    // Toggle the isOpen state
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);
    
    // Update localStorage based on new state
    if (newOpenState) {
      localStorage.setItem('vibeflo_player_open', 'true');
    } else {
      localStorage.removeItem('vibeflo_player_open');
    }
    
    console.log("Player visibility toggled:", newOpenState ? "opened" : "closed");
  };

  // Toggle the player's minimized state
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      localStorage.setItem('vibeflo_player_minimized', 'true');
    } else {
      localStorage.removeItem('vibeflo_player_minimized');
    }
  };

  // Handle search form submission
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setSearchError(null);
    
    if (!searchQuery.trim()) {
      setSearchError('Please enter a search query');
      setIsSearching(false);
      return;
    }
    
    // Check for API key before making the request
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key is missing! Search will not work.');
      setSearchError('YouTube search is unavailable. API key is missing.');
      setSearchResults(mockSearchResults);
      setIsSearching(false);
      toast.error('YouTube search is unavailable. Please contact support.', {
        duration: 5000
      });
      return;
    }
    
    try {
      // Using YouTube Data API v3
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          maxResults: 10,
          q: searchQuery,
          type: 'video',
          key: YOUTUBE_API_KEY
        }
      });
      
      const data = response.data;
      
      if (data.error) {
        console.error('YouTube API error:', data.error);
        throw new Error(data.error.message || 'YouTube API error');
      }
      
      setSearchResults(data.items || []);
    } catch (err: any) {
      console.error('Error searching:', err);
      
      // Handle specific error cases
      if (err.response?.status === 403) {
        setSearchError('YouTube API access denied. The API key may be invalid or restricted.');
        toast.error('YouTube search unavailable. Please contact support.', {
          duration: 5000
        });
      } else {
        setSearchError('YouTube search failed. Showing sample results instead.');
      }
      
      // Fall back to mock results
      setSearchResults(mockSearchResults);
    } finally {
      setIsSearching(false);
    }
  };

  // Save the playlist to the user's account
  const savePlaylistToAccount = async (playlistName: string) => {
    setIsSaving(true);
    try {
      // Assuming playlistAPI has a createPlaylist method that can be used instead of savePlaylist
      await playlistAPI.createPlaylist(playlistName, tracks);
      toast.success('Playlist saved successfully');
    } catch (err) {
      console.error('Error saving playlist:', err);
      toast.error('Failed to save playlist');
    } finally {
      setIsSaving(false);
    }
  };

  // Set the player reference
  const setPlayerReference = (player: any) => {
    playerRef.current = player;
  };

  // Add a dedicated volume control function with clamping
  const handleVolumeChange = (newVolume: number) => {
    // Clamp volume between 0 and 100
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    setVolume(clampedVolume);
    
    // If we have a player reference, update its volume too
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        // YouTube API volume is between 0 and 100
        playerRef.current.setVolume(clampedVolume);
      } catch (err) {
        console.error("Error setting YouTube player volume:", err);
      }
    }
  };

  return (
    <MusicPlayerContext.Provider value={{
      tracks,
      currentTrack,
      isPlaying,
      volume,
      currentTime,
      duration,
      isOpen,
      isMinimized,
      currentTab,
      searchQuery,
      searchResults,
      isSearching,
      addTrack,
      removeTrack,
      playTrack,
      togglePlay,
      play,
      pause,
      playPrevious,
      playNext,
      seek,
      setVolume: handleVolumeChange,
      toggleOpen,
      toggleMinimize,
      setCurrentTab,
      setSearchQuery,
      handleSearch,
      savePlaylistToAccount,
      setPlayerReference
    }}>
      {children}
    </MusicPlayerContext.Provider>
  );
};

// Add the useMusicPlayer hook
export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};