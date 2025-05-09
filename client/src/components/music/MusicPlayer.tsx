import React, { FormEvent, useEffect } from 'react';
import YouTube from 'react-youtube';
import { useMusicPlayer } from '../../contexts/MusicPlayerContext';
import { toast } from 'react-hot-toast';

export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  artwork?: string;
  duration?: number;
  source: string;
}

// Define YouTube search result interface
interface YouTubeSearchResult {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      default: { url: string; width?: number; height?: number };
      high: { url: string; width?: number; height?: number };
    };
  };
}

interface MusicPlayerProps {}

// Global reference to prevent multiple YouTube players
let globalPlayerInstance: any = null;

// Get YouTube API key from environment variable
const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY || '';

// Display warning in console if YouTube API key is missing
if (!YOUTUBE_API_KEY) {
  console.warn('REACT_APP_YOUTUBE_API_KEY is not set. YouTube search functionality will not work.');
}

const MusicPlayer: React.FC<MusicPlayerProps> = () => {
  // We're using togglePlay from context but not directly in this component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    tracks,
    currentTrack,
    isPlaying,
    volume,
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
    setVolume,
    toggleOpen,
    toggleMinimize,
    setCurrentTab,
    setSearchQuery,
    handleSearch,
    savePlaylistToAccount,
    setPlayerReference
  } = useMusicPlayer();

  // Local state for UI-specific items
  const [isVolumeOpen, setIsVolumeOpen] = React.useState(false);
  const [playlistName, setPlaylistName] = React.useState('My Playlist');
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const playerRef = React.useRef<any>(null);

  // Clean up player when component unmounts
  useEffect(() => {
    return () => {
      // Don't destroy the player on navigation
      // This allows playback to continue between pages
    };
  }, []);

  // Check URL parameters on mount
  useEffect(() => {
    // Check if the URL has a musicPlayer=open parameter
    const urlParams = new URLSearchParams(window.location.search);
    const musicPlayerParam = urlParams.get('musicPlayer');
    const keepOpenParam = urlParams.get('keepOpen');
    
    if (musicPlayerParam === 'open') {
      toggleOpen();
      
      // If the keepOpen parameter is set, also update the state
      if (keepOpenParam === 'true') {
        // Ensure the player stays open
        toggleMinimize(); // Toggle if it's currently minimized
        localStorage.setItem('vibeflo_player_open', 'true');
      }
      
      // Remove the parameters from the URL without reloading the page
      const newUrl = window.location.pathname + 
        (urlParams.toString() ? 
          '?' + urlParams.toString().replace(/musicPlayer=open&?/, '')
                              .replace(/keepOpen=true&?/, '')
                              .replace(/refresh=\d+&?/, '')
                              .replace(/&$/, '') 
          : '');
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [toggleOpen, toggleMinimize]);
  
  // Check and keep the player open if needed
  useEffect(() => {
    const checkPlayerOpenState = () => {
      const shouldBeOpen = localStorage.getItem('vibeflo_player_open');
      if (shouldBeOpen === 'true' && !isOpen) {
        toggleOpen();
        // Remove the flag after handling it
        localStorage.removeItem('vibeflo_player_open');
      }
    };
    
    // Check immediately and then set up a short interval
    checkPlayerOpenState();
    const intervalId = setInterval(checkPlayerOpenState, 300);
    
    return () => clearInterval(intervalId);
  }, [isOpen, toggleOpen]);

  // Extract YouTube ID from URL with improved pattern matching
  const extractYouTubeId = (url: string): string => {
    if (!url) return '';
    
    try {
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
      
      return '';
    } catch (err) {
      console.error("Error extracting YouTube ID:", err);
      return '';
    }
  };

  // Add track from search results
  const addTrackToPlaylist = (result: any) => {
    const newTrack: Track = {
      id: result.id.videoId,
      title: result.snippet.title,
      artist: result.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${result.id.videoId}`,
      artwork: result.snippet.thumbnails.high.url,
      source: 'youtube'
    };
    
    addTrack(newTrack);
  };

  // Handle playlist saving
  const handleSavePlaylist = () => {
    savePlaylistToAccount(playlistName);
  };

  // Volume change handler for local UI
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    
    // Also update the current player volume directly
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
    }
  };

  const handleSearchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await handleSearch(e);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Search failed');
    }
  };

  // Handle player ready event with error checking
  const handlePlayerReady = (event: any) => {
    try {
      // Verify we received a valid player object
      if (!event || !event.target) {
        console.error("Received invalid player object in ready handler");
        return;
      }
      
      // Store reference to player
      playerRef.current = event.target;
      globalPlayerInstance = event.target;
      
      // Log that the player is ready
      console.log("YouTube player initialized successfully");
      
      // Update reference in context
      setPlayerReference(event.target);
      
      // Set the volume
      if (event.target && typeof event.target.setVolume === 'function') {
        event.target.setVolume(volume);
      }
      
      // If isPlaying is true, start playing with error checking
      if (isPlaying && event.target && typeof event.target.playVideo === 'function') {
        // Slight delay to ensure player is fully ready
        setTimeout(() => {
          try {
            event.target.playVideo();
            console.log("Player initialized and playing", currentTrack?.title);
          } catch (err) {
            console.error("Error starting playback in handlePlayerReady:", err);
            // Retry once more after a longer delay
            setTimeout(() => {
              try {
                if (event.target && typeof event.target.playVideo === 'function') {
                  event.target.playVideo();
                }
              } catch (innerErr) {
                console.error("Error on retry playback:", innerErr);
                // If we failed twice, try the next track
                if (tracks.length > 1) {
                  toast.error(`Playback error. Skipping to next track.`, { 
                    duration: 1500 
                  });
                  setTimeout(() => playNext(), 500);
                }
              }
            }, 2000);
          }
        }, 1000);
      }
    } catch (err) {
      console.error("Error in handlePlayerReady:", err);
      
      // If we can't initialize the player at all, try the next track
      if (tracks.length > 1) {
        toast.error(`Player initialization error. Skipping to next track.`, { 
          duration: 1500 
        });
        setTimeout(() => playNext(), 500);
      }
    }
  };

  // Play track when it changes
  useEffect(() => {
    if (currentTrack && isPlaying) {
      // Slight delay to ensure YouTube API is ready
      const initTimer = setTimeout(() => {
        // Safety check - make sure we have a valid player instance
        if (!globalPlayerInstance) {
          console.log("No player instance available yet, will try to initialize one");
          // Try to recreate the component
          setPlayerReference(null);
          return;
        }
        
        // Check that the player object has the required methods
        if (typeof globalPlayerInstance.playVideo === 'function') {
          try {
            globalPlayerInstance.playVideo();
            console.log("Auto-playing track:", currentTrack.title);
          } catch (err) {
            console.error("Error playing track:", err);
            
            // Try again after a longer delay
            const retryTimer = setTimeout(() => {
              if (globalPlayerInstance && typeof globalPlayerInstance.playVideo === 'function') {
                try {
                  globalPlayerInstance.playVideo();
                } catch (retryErr) {
                  console.error("Error on retry:", retryErr);
                  // If still failing, try next track
                  if (tracks.length > 1) {
                    toast.error(`Playback error. Skipping to next track.`, { 
                      duration: 1500 
                    });
                    setTimeout(() => playNext(), 500);
                  }
                }
              }
            }, 2000);
            
            return () => clearTimeout(retryTimer);
          }
        } else {
          console.log("YouTube player not ready yet, will try again");
          // Try again after another short delay
          const retryTimer = setTimeout(() => {
            if (globalPlayerInstance && typeof globalPlayerInstance.playVideo === 'function') {
              try {
                globalPlayerInstance.playVideo();
              } catch (err) {
                console.error("Error on retry:", err);
              }
            } else {
              // If still not ready, try next track
              console.log("Player still not ready, skipping to next track");
              playNext();
            }
          }, 2000);
          
          return () => clearTimeout(retryTimer);
        }
      }, 1000); // Increased delay
      
      return () => clearTimeout(initTimer);
    }
  }, [currentTrack, isPlaying, playNext, tracks]);

  const handlePlayerError = (event: any) => {
    console.error('YouTube player error:', event);
    toast.error('Error playing video. Please try again.');
  };

  return (
    <>
      {/* Music Player Button - fixed to bottom right, hide when player is open */}
      {!isOpen && (
        <button 
          onClick={toggleOpen}
          className="fixed bottom-6 right-6 z-40 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition-all duration-300"
          aria-label="Toggle Music Player"
          data-testid="music-player-button"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </button>
      )}

      {/* Slide-out Music Player Panel */}
      <div 
        className={`fixed right-0 bottom-0 z-50 bg-gray-900 border-l border-t border-gray-700 shadow-lg transition-all duration-300 ease-in-out ${
          isOpen 
            ? isMinimized 
              ? 'w-96 h-20' 
              : 'w-96 h-[600px]' 
            : 'translate-x-full w-96 h-[600px]'
        }`}
        data-testid="music-player-container"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-white font-bold text-lg">Music Player</h3>
            <div className="flex space-x-2">
              <button
                onClick={toggleMinimize}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label={isMinimized ? "Expand player" : "Minimize player"}
              >
                {isMinimized ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              <button
                onClick={toggleOpen}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Minimized view - only show current track info and controls */}
          {isMinimized && currentTrack && (
            <div className="p-2 flex items-center justify-between">
              <div className="flex items-center flex-1 min-w-0">
                {currentTrack.artwork && (
                  <img 
                    src={currentTrack.artwork} 
                    alt={currentTrack.title} 
                    className="w-10 h-10 rounded object-cover mr-2 flex-shrink-0"
                  />
                )}
                <div className="min-w-0 max-w-[180px] sm:max-w-[220px]">
                  <h4 className="text-white text-sm font-medium truncate">{currentTrack.title}</h4>
                  <p className="text-gray-400 text-xs truncate">{currentTrack.artist}</p>
                </div>
              </div>
              <div className="flex items-center relative">
                <button
                  onClick={() => setIsVolumeOpen(!isVolumeOpen)}
                  className="text-gray-400 hover:text-white mx-1 hidden sm:block"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </button>
                
                {/* Volume Popup */}
                {isVolumeOpen && (
                  <div className="absolute bottom-10 right-0 bg-gray-800 rounded shadow-lg p-3 border border-gray-700 w-32">
                    <div className="flex flex-col items-center space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-full accent-purple-500"
                        aria-label="Volume control"
                      />
                      <span className="text-xs text-gray-400">{volume}%</span>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={playPrevious}
                  className="text-gray-400 hover:text-white mx-1"
                  aria-label="Previous track"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>
                <button
                  onClick={isPlaying ? pause : play}
                  className="text-white hover:text-gray-200 transition-colors"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isPlaying ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    ) : (
                      <>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </>
                    )}
                  </svg>
                </button>
                <button
                  onClick={playNext}
                  className="text-gray-400 hover:text-white mx-1"
                  aria-label="Next track"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* YouTube Player - always render but hide */}
          <div style={{ display: 'none' }}>
            {currentTrack && currentTrack.url && extractYouTubeId(currentTrack.url) && (
              <YouTube
                videoId={extractYouTubeId(currentTrack.url)}
                opts={{
                  height: '0',
                  width: '0',
                  playerVars: {
                    // https://developers.google.com/youtube/player_parameters
                    autoplay: 0, // Change to manual control
                    controls: 0,
                    disablekb: 1,
                    enablejsapi: 1,
                    iv_load_policy: 3,
                    origin: window.location.origin,
                    rel: 0,
                  },
                }}
                onReady={handlePlayerReady}
                onError={handlePlayerError}
                onStateChange={(event: any) => {
                  try {
                    // When the video ends, automatically play the next track
                    if (event.data === 0) { // YouTube API's code for "ended"
                      playNext();
                    }
                  } catch (err) {
                    console.error("Error in onStateChange:", err);
                  }
                }}
              />
            )}
          </div>
          
          {/* Full view - with tabs */}
          {!isMinimized && (
            <>
              {/* Tabs */}
              <div className="border-b border-gray-700 bg-gray-800 px-1">
                <div className="flex w-full gap-1">
                  <button
                    onClick={() => setCurrentTab('nowPlaying')}
                    className={`flex-1 py-2 text-center text-sm font-medium transition-all duration-200 ${
                      currentTab === 'nowPlaying' 
                        ? 'text-white border-b-2 border-blue-400' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                    data-testid="tab-nowPlaying"
                  >
                    Now Playing
                  </button>
                  <button
                    onClick={() => setCurrentTab('playlist')}
                    className={`flex-1 py-2 text-center text-sm font-medium transition-all duration-200 ${
                      currentTab === 'playlist' 
                        ? 'text-white border-b-2 border-blue-400' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                    data-testid="tab-playlist"
                  >
                    Playlist
                  </button>
                  <button
                    onClick={() => setCurrentTab('search')}
                    className={`flex-1 py-2 text-center text-sm font-medium transition-all duration-200 ${
                      currentTab === 'search' 
                        ? 'text-white border-b-2 border-blue-400' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                    data-testid="tab-search"
                  >
                    Search
                  </button>
                </div>
              </div>
              
              {/* Content area */}
              <div className="flex-1 overflow-y-auto">
                {/* Now Playing Tab */}
                {currentTab === 'nowPlaying' && (
                  <div className="p-4 flex flex-col items-center">
                    {currentTrack ? (
                      <>
                        <div className="mb-4 text-center">
                          {currentTrack.artwork ? (
                            <img
                              src={currentTrack.artwork}
                              alt={currentTrack.title}
                              className="w-48 h-48 mx-auto rounded object-cover shadow-lg flex-shrink-0"
                            />
                          ) : (
                            <div className="w-48 h-48 mx-auto rounded bg-gray-800 flex items-center justify-center flex-shrink-0">
                              <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                              </svg>
                            </div>
                          )}
                          
                          <div className="mt-3 w-full px-2">
                            <h4 className="text-white font-medium truncate max-w-[280px] mx-auto">{currentTrack.title}</h4>
                            <p className="text-gray-400 text-sm truncate max-w-[280px] mx-auto">{currentTrack.artist}</p>
                          </div>
                        </div>
                        
                        <div className="w-full">
                          {/* Volume control */}
                          <div className="mb-4 flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={volume}
                              onChange={handleVolumeChange}
                              className="w-24 accent-purple-500"
                              aria-label="Volume control"
                            />
                            <span className="text-xs text-gray-400">{volume}%</span>
                          </div>
                          
                          <div className="flex items-center justify-center space-x-6 mb-6">
                            <button
                              onClick={playPrevious}
                              className="text-gray-400 hover:text-white transition-colors"
                              aria-label="Previous track"
                            >
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 19l-7-7m0 0l7-7m-7 7h18"
                                />
                              </svg>
                            </button>
                            
                            <button
                              onClick={isPlaying ? pause : play}
                              className="text-white hover:text-gray-200 transition-colors"
                              aria-label={isPlaying ? "Pause" : "Play"}
                            >
                              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isPlaying ? (
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                ) : (
                                  <>
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </>
                                )}
                              </svg>
                            </button>
                            
                            <button
                              onClick={playNext}
                              className="text-gray-400 hover:text-white transition-colors"
                              aria-label="Next track"
                            >
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-gray-400 text-center p-4">
                        <div>
                          <p>No track selected</p>
                          <p className="text-sm mt-2">Add music from the search tab or playlists page</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Playlist Tab */}
                {currentTab === 'playlist' && (
                  <div className="p-4">
                    <div className="flex items-center mb-4">
                      <input
                        type="text"
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                        className="flex-1 bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm"
                        placeholder="Playlist name"
                      />
                      <button
                        onClick={handleSavePlaylist}
                        disabled={!tracks.length}
                        className="ml-2 bg-purple-600 hover:bg-purple-700 text-white rounded px-3 py-2 text-sm disabled:bg-gray-700 disabled:cursor-not-allowed"
                        data-testid="save-playlist-button"
                      >
                        Save
                      </button>
                    </div>
                    
                    {tracks.length === 0 ? (
                      <div className="text-gray-400 text-center py-6">
                        <p>Your playlist is empty</p>
                        <p className="text-sm mt-2">Add tracks from the search tab</p>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {tracks.map((track: Track) => (
                          <li
                            key={track.id}
                            className={`flex items-center p-2 rounded ${
                              currentTrack?.id === track.id
                                ? 'bg-gray-800 border-l-4 border-purple-500'
                                : 'hover:bg-gray-800'
                            }`}
                          >
                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => playTrack(track)}
                            >
                              <div className="flex items-center">
                                {track.artwork && (
                                  <img
                                    src={track.artwork}
                                    alt={track.title}
                                    className="w-10 h-10 rounded mr-3 object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="min-w-0 max-w-[200px]">
                                  <h4 className="text-white text-sm font-medium truncate">
                                    {track.title}
                                  </h4>
                                  <p className="text-gray-400 text-xs truncate">{track.artist}</p>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeTrack(track.id);
                              }}
                              className="ml-2 text-gray-400 hover:text-red-400"
                              aria-label="Remove track"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                
                {/* Search Tab */}
                {currentTab === 'search' && (
                  <div className="p-4 flex flex-col h-full">
                    <h4 className="font-semibold text-white mb-3">Search</h4>
                    
                    {!YOUTUBE_API_KEY && (
                      <div className="mb-4 p-3 bg-yellow-800/50 border border-yellow-600 rounded-md text-yellow-200 text-sm">
                        <p className="font-semibold">YouTube API key is missing</p>
                        <p className="mt-1">Search functionality is unavailable. Please contact the administrator.</p>
                      </div>
                    )}
                    
                    <form onSubmit={handleSearchSubmit} className="mb-4" data-testid="search-form">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search for songs..."
                          className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded text-white"
                          data-testid="search-input"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
                          disabled={!YOUTUBE_API_KEY}
                          data-testid="search-button"
                        >
                          Search
                        </button>
                      </div>
                    </form>
                    
                    {searchResults.length === 0 && isSearching ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                      </div>
                    ) : searchError ? (
                      <div className="text-center py-8 text-red-400">
                        <p>{searchError}</p>
                        <p className="text-sm mt-2">Please try again later</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <ul className="space-y-2">
                        {searchResults.map((result: YouTubeSearchResult) => (
                          <li key={result.id.videoId} className="flex items-center p-2 hover:bg-gray-800 rounded">
                            <img
                              src={result.snippet.thumbnails.default.url}
                              alt={result.snippet.title}
                              className="w-12 h-12 rounded object-cover mr-3 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white text-sm font-medium line-clamp-1">
                                {result.snippet.title}
                              </h4>
                              <p className="text-gray-400 text-xs truncate">{result.snippet.channelTitle}</p>
                              <button
                                onClick={() => addTrackToPlaylist(result)}
                                className="mt-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded px-2 py-1"
                                data-testid="add-track-button"
                              >
                                Add to Playlist
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : searchQuery ? (
                      <div className="text-gray-400 text-center py-8">
                        <p>No results found</p>
                        <p className="text-sm mt-2">Try a different search term</p>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-center py-8">
                        <p>Search YouTube for music</p>
                        <p className="text-sm mt-2">Results will appear here</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Click outside listener for volume control */}
      {isVolumeOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsVolumeOpen(false)}
        ></div>
      )}
    </>
  );
};

export default MusicPlayer; 