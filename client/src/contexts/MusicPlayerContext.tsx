import React, { createContext, useContext, useState, useRef, useEffect, FormEvent } from 'react';
import { Track } from '../components/music/MusicPlayer';
import { playlistAPI } from '../services/api';
import { toast } from 'react-hot-toast';

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

const MusicPlayerContext = createContext<MusicPlayerContextType>({
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
  
  const playerRef = useRef<any>(null);
  
  // YouTube API key
  const YOUTUBE_API_KEY = 'AIzaSyCoui8gnwmosPMGCGuX2cImY4SLre7JgiA';
  
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
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
    if (playerRef.current) {
      playerRef.current.playVideo();
      
      // Only show toast on manual play, not auto-play
      const truncatedTitle = currentTrack.title.length > 30 
        ? `${currentTrack.title.slice(0, 30)}...` 
        : currentTrack.title;
      toast.success(`Playing: ${truncatedTitle}`, { 
        id: 'play-status',  // Using ID prevents multiple toasts when clicking play repeatedly
        duration: 1500      // Shorter duration for playback toasts
      });
    }
  };

  // Pause the current track
  const pause = () => {
    setIsPlaying(false);
    if (playerRef.current) {
      playerRef.current.pauseVideo();
      
      if (currentTrack) {
        toast.success('Paused', { 
          id: 'play-status',  // Using same ID as play toast
          duration: 1500      // Shorter duration
        });
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
    
    const truncatedTitle = previousTrack.title.length > 30 
      ? `${previousTrack.title.slice(0, 30)}...` 
      : previousTrack.title;
    toast.success(`Playing: ${truncatedTitle}`, { 
      id: 'track-change',
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
    
    const truncatedTitle = nextTrack.title.length > 30 
      ? `${nextTrack.title.slice(0, 30)}...` 
      : nextTrack.title;
    toast.success(`Playing: ${truncatedTitle}`, {
      id: 'track-change',
      duration: 1500
    });
  };

  // Seek to a specific time
  const seek = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time);
      setCurrentTime(time);
    }
  };

  // Set the volume
  const handleSetVolume = (newVolume: number) => {
    // Only show notification when volume changes significantly (>10%)
    const significantChange = Math.abs(newVolume - volume) >= 10;
    
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
      
      // Show toast only for significant volume changes
      if (significantChange) {
        toast.success(`Volume: ${newVolume}%`, { 
          id: 'volume-change',
          duration: 1000
        });
      }
    }
  };

  // Toggle the music player open/closed
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  // Toggle the music player minimized
  const toggleMinimize = () => {
    if (!isMinimized) {
      setCurrentTab('nowPlaying');
    }
    setIsMinimized(!isMinimized);
  };

  // Handle search
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(
        searchQuery
      )}&type=video&key=${YOUTUBE_API_KEY}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('YouTube API Error:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        throw new Error(`YouTube API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        setSearchResults(data.items);
        toast.success(`Found ${data.items.length} tracks for "${searchQuery}"`);
      } else {
        setSearchResults(mockSearchResults);
        toast(`No results for "${searchQuery}". Showing sample tracks`);
      }
    } catch (error) {
      console.error('Error searching YouTube:', error);
      
      // Fall back to mock results on error
      setSearchResults(mockSearchResults);
      toast.error(`Search failed for "${searchQuery}". Showing sample tracks`);
    } finally {
      setIsSearching(false);
    }
  };

  // Save playlist to account
  const savePlaylistToAccount = async (playlistName: string) => {
    if (!tracks.length) {
      toast.error('Cannot save an empty playlist');
      return;
    }
    
    setIsSaving(true);
    
    try {
      await playlistAPI.createPlaylist(playlistName, tracks);
      toast.success(`Playlist "${playlistName}" saved (${tracks.length} tracks)`);
    } catch (error) {
      console.error('Error saving playlist:', error);
      toast.error('Failed to save playlist');
    } finally {
      setIsSaving(false);
    }
  };

  // Set playerRef from MusicPlayer component
  const setPlayerReference = (player: any) => {
    playerRef.current = player;
    // Initialize with current volume when a new player is created
    if (player) {
      player.setVolume(volume);
    }
  };

  return (
    <MusicPlayerContext.Provider
      value={{
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
        setVolume: handleSetVolume,
        toggleOpen,
        toggleMinimize,
        setCurrentTab,
        setSearchQuery,
        handleSearch,
        savePlaylistToAccount,
        setPlayerReference
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => useContext(MusicPlayerContext); 