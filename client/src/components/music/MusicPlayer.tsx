import React, { useState, useEffect, useRef, FormEvent } from 'react';
import YouTube from 'react-youtube';
import { playlistAPI } from '../../services/api';
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

interface MusicPlayerProps {
  tracks?: Track[];
  currentTrack?: Track;
  onTrackSelect?: (track: Track) => void;
  onTrackEnd?: () => void;
}

type PlayerTab = 'nowPlaying' | 'playlist' | 'search';

const MusicPlayer: React.FC<MusicPlayerProps> = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<PlayerTab>('nowPlaying');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [playlistName, setPlaylistName] = useState('My Playlist');
  const [isSaving, setIsSaving] = useState(false);
  const playerRef = useRef<any>(null);

  // YouTube API key - Note: this is a public API key with limited usage
  const YOUTUBE_API_KEY = 'AIzaSyDx9j8JP7hEYQ5xQR2zUklWQGbiGcPsyUA';

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

  useEffect(() => {
    // Load tracks from localStorage
    const storedTracks = localStorage.getItem('vibeflo_playlist');
    const storedCurrentTrack = localStorage.getItem('vibeflo_current_track');
    
    if (storedTracks) {
      setTracks(JSON.parse(storedTracks));
    }
    
    if (storedCurrentTrack) {
      setCurrentTrack(JSON.parse(storedCurrentTrack));
    }
    
    // Listen for playlist updates
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

  const extractYouTubeId = (url: string): string => {
    const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
    return match ? match[1] : '';
  };

  const handlePlay = () => {
    setIsPlaying(true);
    playerRef.current?.playVideo();
  };

  const handlePause = () => {
    setIsPlaying(false);
    playerRef.current?.pauseVideo();
  };

  const handleNextTrack = () => {
    if (!currentTrack || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(track => track.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    const nextTrack = tracks[nextIndex];
    
    setCurrentTrack(nextTrack);
    localStorage.setItem('vibeflo_current_track', JSON.stringify(nextTrack));
  };

  const handlePreviousTrack = () => {
    if (!currentTrack || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(track => track.id === currentTrack.id);
    const previousIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    const previousTrack = tracks[previousIndex];
    
    setCurrentTrack(previousTrack);
    localStorage.setItem('vibeflo_current_track', JSON.stringify(previousTrack));
  };

  const togglePlayer = () => {
    setIsOpen(!isOpen);
  };

  const selectTrack = (track: Track) => {
    setCurrentTrack(track);
    localStorage.setItem('vibeflo_current_track', JSON.stringify(track));
    setIsPlaying(true);
    setCurrentTab('nowPlaying');
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    
    // Use mock data instead of real API for demo purposes
    setTimeout(() => {
      console.log('Using mock search data for:', searchQuery);
      
      // Filter mock results based on search query
      const filteredResults = mockSearchResults.filter(
        result => 
          result.snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.snippet.channelTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      if (filteredResults.length > 0) {
        setSearchResults(filteredResults);
        toast.success('Demo tracks found');
      } else {
        // If no matches in the filter, just return all mock results
        setSearchResults(mockSearchResults);
        toast('Showing sample tracks (demo mode)');
      }
      
      setIsSearching(false);
    }, 800); // Simulate network delay
  };

  const addTrackToPlaylist = (result: any) => {
    const newTrack: Track = {
      id: result.id.videoId,
      title: result.snippet.title,
      artist: result.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${result.id.videoId}`,
      artwork: result.snippet.thumbnails.high.url,
      source: 'youtube'
    };
    
    const updatedTracks = [...tracks, newTrack];
    setTracks(updatedTracks);
    localStorage.setItem('vibeflo_playlist', JSON.stringify(updatedTracks));
    
    if (!currentTrack) {
      selectTrack(newTrack);
    }
    
    toast.success('Added to playlist');
  };

  const removeTrackFromPlaylist = (trackId: string) => {
    const updatedTracks = tracks.filter(track => track.id !== trackId);
    setTracks(updatedTracks);
    localStorage.setItem('vibeflo_playlist', JSON.stringify(updatedTracks));
    
    if (currentTrack?.id === trackId) {
      if (updatedTracks.length > 0) {
        selectTrack(updatedTracks[0]);
      } else {
        setCurrentTrack(null);
        localStorage.removeItem('vibeflo_current_track');
      }
    }
    
    toast.success('Removed from playlist');
  };

  const savePlaylistToAccount = async () => {
    if (!tracks.length) {
      toast.error('Cannot save an empty playlist');
      return;
    }
    
    setIsSaving(true);
    
    try {
      await playlistAPI.createPlaylist(playlistName, tracks);
      toast.success('Playlist saved to your account');
    } catch (error) {
      console.error('Error saving playlist:', error);
      toast.error('Failed to save playlist');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Music Player Button - fixed to bottom right */}
      <button 
        onClick={togglePlayer}
        className="fixed bottom-6 right-6 z-40 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition-all duration-300"
        aria-label="Toggle Music Player"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </button>

      {/* Slide-out Music Player Panel */}
      <div 
        className={`fixed right-0 bottom-0 z-30 bg-gray-900 border-l border-t border-gray-700 shadow-lg w-96 h-[600px] transition-transform duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-white font-bold text-lg">Music Player</h3>
            <button
              onClick={togglePlayer}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              className={`flex-1 py-2 text-sm font-medium ${
                currentTab === 'nowPlaying'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setCurrentTab('nowPlaying')}
            >
              Now Playing
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium ${
                currentTab === 'playlist'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setCurrentTab('playlist')}
            >
              Playlist ({tracks.length})
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium ${
                currentTab === 'search'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setCurrentTab('search')}
            >
              Search
            </button>
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
                          className="w-48 h-48 mx-auto rounded object-cover shadow-lg"
                        />
                      ) : (
                        <div className="w-48 h-48 mx-auto rounded bg-gray-800 flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        </div>
                      )}
                      
                      <div className="mt-3">
                        <h4 className="text-white font-medium truncate">{currentTrack.title}</h4>
                        <p className="text-gray-400 text-sm truncate">{currentTrack.artist}</p>
                      </div>
                    </div>
                    
                    <div className="w-full">
                      <div className="flex items-center justify-center space-x-6 mb-6">
                        <button
                          onClick={handlePreviousTrack}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                        </button>
                        
                        {isPlaying ? (
                          <button
                            onClick={handlePause}
                            className="text-white hover:text-gray-200 transition-colors"
                          >
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={handlePlay}
                            className="text-white hover:text-gray-200 transition-colors"
                          >
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        
                        <button
                          onClick={handleNextTrack}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
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
                    onClick={savePlaylistToAccount}
                    disabled={isSaving || !tracks.length}
                    className="ml-2 bg-purple-600 hover:bg-purple-700 text-white rounded px-3 py-2 text-sm disabled:bg-gray-700 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
                
                {tracks.length === 0 ? (
                  <div className="text-gray-400 text-center py-6">
                    <p>Your playlist is empty</p>
                    <p className="text-sm mt-2">Add tracks from the search tab</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {tracks.map((track) => (
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
                          onClick={() => selectTrack(track)}
                        >
                          <div className="flex items-center">
                            {track.artwork && (
                              <img
                                src={track.artwork}
                                alt={track.title}
                                className="w-10 h-10 rounded mr-3 object-cover"
                              />
                            )}
                            <div className="min-w-0">
                              <h4 className="text-white text-sm font-medium truncate">
                                {track.title}
                              </h4>
                              <p className="text-gray-400 text-xs truncate">{track.artist}</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeTrackFromPlaylist(track.id)}
                          className="ml-2 text-gray-400 hover:text-red-400"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
              <div className="p-4">
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="flex">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-l px-3 py-2"
                      placeholder="Search YouTube..."
                    />
                    <button
                      type="submit"
                      disabled={isSearching || !searchQuery.trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-r px-3 py-2 disabled:bg-gray-700 disabled:cursor-not-allowed"
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </form>
                
                {isSearching ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                ) : searchError ? (
                  <div className="text-red-400 text-center py-8">
                    <p>{searchError}</p>
                    <p className="text-sm mt-2">Please try again later</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <ul className="space-y-3">
                    {searchResults.map((result) => (
                      <li key={result.id.videoId} className="flex items-start p-2 hover:bg-gray-800 rounded">
                        <img
                          src={result.snippet.thumbnails.default.url}
                          alt={result.snippet.title}
                          className="w-16 h-16 rounded object-cover mr-3"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-sm font-medium line-clamp-2">
                            {result.snippet.title}
                          </h4>
                          <p className="text-gray-400 text-xs truncate">{result.snippet.channelTitle}</p>
                          <button
                            onClick={() => addTrackToPlaylist(result)}
                            className="mt-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded px-2 py-1"
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
        </div>
      </div>
      
      {currentTrack?.source === 'youtube' && (
        <div className="hidden">
          <YouTube
            videoId={extractYouTubeId(currentTrack.url)}
            opts={{
              height: '0',
              width: '0',
              playerVars: {
                autoplay: 1,
                controls: 0,
                disablekb: 1,
                fs: 0,
                modestbranding: 1,
                playsinline: 1
              }
            }}
            onReady={(event) => {
              playerRef.current = event.target;
            }}
            onEnd={handleNextTrack}
            onError={() => {
              console.error('YouTube player error');
              handleNextTrack();
            }}
          />
        </div>
      )}
    </>
  );
};

export default MusicPlayer; 