import React, { useEffect, useState, FormEvent } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MusicPlayerProvider, useMusicPlayer } from '../../contexts/MusicPlayerContext';
import axios from 'axios';

// Define mock track data - but create it as a function to get fresh copies
const getMockTracks = () => [
  {
    id: 'track1',
    title: 'Test Track 1',
    artist: 'Test Artist 1',
    url: 'https://www.youtube.com/watch?v=abc123',
    artwork: 'https://i.ytimg.com/vi/abc123/default.jpg',
    source: 'youtube'
  },
  {
    id: 'track2',
    title: 'Test Track 2',
    artist: 'Test Artist 2',
    url: 'https://www.youtube.com/watch?v=def456',
    artwork: 'https://i.ytimg.com/vi/def456/default.jpg',
    source: 'youtube'
  }
];

// Mock axios
jest.mock('axios');

// Mock the API service
jest.mock('../../services/api', () => ({
  playlistAPI: {
    createPlaylist: jest.fn().mockResolvedValue({ id: 'playlist1', name: 'Test Playlist' }),
  }
}));

// Import the mocked module
import { playlistAPI } from '../../services/api';

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock YouTube player
jest.mock('react-youtube', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ onReady }) => {
    // Simulate the YouTube player
    if (onReady) {
      setTimeout(() => {
        onReady({
          target: {
            playVideo: jest.fn(),
            pauseVideo: jest.fn(),
            seekTo: jest.fn(),
            setVolume: jest.fn(),
          }
        });
      }, 0);
    }
    return <div data-testid="youtube-player">YouTube Player Mock</div>;
  })
}));

// Reusable test component that shows key state and functionality
const TestComponent = () => {
  const {
    tracks,
    currentTrack,
    isPlaying,
    volume,
    isOpen,
    addTrack,
    removeTrack,
    playTrack,
    togglePlay,
    playNext,
    playPrevious,
    toggleOpen,
    setVolume,
    handleSearch,
    searchResults,
    searchQuery,
    setSearchQuery,
    savePlaylistToAccount,
    isMinimized,
    toggleMinimize
  } = useMusicPlayer();

  return (
    <div>
      <div data-testid="player-state">
        <div data-testid="track-count">{tracks.length} Tracks</div>
        <div data-testid="current-track">{currentTrack ? currentTrack.title : 'No Track'}</div>
        <div data-testid="playing-state">{isPlaying ? 'Playing' : 'Paused'}</div>
        <div data-testid="volume-level">Volume: {volume}</div>
        <div data-testid="player-open">{isOpen ? 'Open' : 'Closed'}</div>
        <div data-testid="player-minimized">{isMinimized ? 'Minimized' : 'Full'}</div>
        <div data-testid="search-results-count">
          {searchResults ? `${searchResults.length} results` : '0 results'}
        </div>
      </div>

      <div data-testid="player-controls">
        <button 
          data-testid="add-track-btn" 
          onClick={() => addTrack(getMockTracks()[0])}
        >
          Add Track
        </button>
        
        <button 
          data-testid="remove-track-btn" 
          onClick={() => tracks.length > 0 && removeTrack(tracks[0].id)}
        >
          Remove Track
        </button>
        
        <button 
          data-testid="play-track-btn" 
          onClick={() => tracks.length > 0 && playTrack(tracks[0])}
        >
          Play First Track
        </button>
        
        <button 
          data-testid="toggle-play-btn" 
          onClick={togglePlay}
        >
          Toggle Play
        </button>
        
        <button 
          data-testid="next-track-btn" 
          onClick={playNext}
        >
          Next Track
        </button>
        
        <button 
          data-testid="prev-track-btn" 
          onClick={playPrevious}
        >
          Previous Track
        </button>
        
        <button 
          data-testid="toggle-open-btn" 
          onClick={toggleOpen}
        >
          Toggle Open
        </button>
        
        <button 
          data-testid="toggle-minimize-btn" 
          onClick={toggleMinimize}
        >
          Toggle Minimize
        </button>
        
        <input
          data-testid="volume-slider"
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(parseInt(e.target.value))}
        />
        
        <input
          data-testid="search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for music"
        />
        
        <button
          data-testid="search-btn"
          onClick={(e) => {
            e.preventDefault();
            handleSearch(e as any);
          }}
        >
          Search
        </button>
        
        <button
          data-testid="save-playlist-btn"
          onClick={() => savePlaylistToAccount("Test Playlist")}
        >
          Save Playlist
        </button>
      </div>
    </div>
  );
};

// Shared setup for all tests
describe('MusicPlayerContext', () => {
  // Mock localStorage with Jest mock functions
  const getItemMock = jest.fn();
  const setItemMock = jest.fn();
  const removeItemMock = jest.fn();
  const clearMock = jest.fn();
  
  // Clean up between tests
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up localStorage mocks
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: getItemMock,
        setItem: setItemMock,
        removeItem: removeItemMock,
        clear: clearMock,
        length: 0,
        key: jest.fn()
      },
      writable: true
    });
    
    // Default behavior for localStorage.getItem
    getItemMock.mockImplementation(() => null);
    
    // Reset environment variables
    delete process.env.REACT_APP_YOUTUBE_API_KEY;
  });
  
  afterEach(() => {
    // Ensure timers are cleaned up
    jest.useRealTimers();
  });

  // Group 1: Basic player functionality tests
  describe('Basic Player Functionality', () => {
    test('provides initial empty state and allows adding/removing tracks', async () => {
      render(
        <MusicPlayerProvider>
          <TestComponent />
        </MusicPlayerProvider>
      );
      
      // Check initial state
      expect(screen.getByTestId('track-count')).toHaveTextContent('0 Tracks');
      expect(screen.getByTestId('current-track')).toHaveTextContent('No Track');
      expect(screen.getByTestId('playing-state')).toHaveTextContent('Paused');
      expect(screen.getByTestId('volume-level')).toHaveTextContent('Volume: 50');
      expect(screen.getByTestId('player-open')).toHaveTextContent('Closed');
      
      // Add a track
      await act(async () => {
        fireEvent.click(screen.getByTestId('add-track-btn'));
      });
      
      // Check if track was added
      expect(screen.getByTestId('track-count')).toHaveTextContent('1 Tracks');
      expect(setItemMock).toHaveBeenCalledWith(
        'vibeflo_playlist',
        expect.any(String)
      );
      
      // Now remove it
      await act(async () => {
        fireEvent.click(screen.getByTestId('remove-track-btn'));
      });
      
      // Check if track was removed
      expect(screen.getByTestId('track-count')).toHaveTextContent('0 Tracks');
    });

    test('handles playback controls (play, pause, next, previous)', async () => {
      render(
        <MusicPlayerProvider>
          <TestComponent />
        </MusicPlayerProvider>
      );
      
      // Add two tracks
      await act(async () => {
        fireEvent.click(screen.getByTestId('add-track-btn'));
        fireEvent.click(screen.getByTestId('add-track-btn'));
      });
      
      // Play first track
      await act(async () => {
        fireEvent.click(screen.getByTestId('play-track-btn'));
      });
      
      // Check if playing
      expect(screen.getByTestId('playing-state')).toHaveTextContent('Playing');
      expect(screen.getByTestId('current-track')).toHaveTextContent('Test Track 1');
      
      // Pause
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-play-btn'));
      });
      
      expect(screen.getByTestId('playing-state')).toHaveTextContent('Paused');
      
      // Play again
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-play-btn'));
      });
      
      expect(screen.getByTestId('playing-state')).toHaveTextContent('Playing');
      
      // Next track
      await act(async () => {
        fireEvent.click(screen.getByTestId('next-track-btn'));
      });
      
      // Previous track
      await act(async () => {
        fireEvent.click(screen.getByTestId('prev-track-btn'));
      });
      
      expect(screen.getByTestId('current-track')).toHaveTextContent('Test Track 1');
    });
    
    test('toggles UI states (open/close, minimize)', async () => {
      render(
        <MusicPlayerProvider>
          <TestComponent />
        </MusicPlayerProvider>
      );
      
      // Initially closed
      expect(screen.getByTestId('player-open')).toHaveTextContent('Closed');
      
      // Toggle open
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-open-btn'));
      });
      
      expect(screen.getByTestId('player-open')).toHaveTextContent('Open');
      
      // Toggle minimize
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-minimize-btn'));
      });
      
      expect(screen.getByTestId('player-minimized')).toHaveTextContent('Minimized');
      
      // Toggle back to full
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-minimize-btn'));
      });
      
      expect(screen.getByTestId('player-minimized')).toHaveTextContent('Full');
    });
    
    test('changes volume and handles value limits', async () => {
      // Create a mock player
      const mockSetVolume = jest.fn();
      const mockPlayerRef = { setVolume: mockSetVolume };
      
      const VolumeTestComponent = () => {
        const { volume, setVolume, setPlayerReference } = useMusicPlayer();
        
        useEffect(() => {
          setPlayerReference(mockPlayerRef);
        }, [setPlayerReference]);
        
        return (
          <div>
            <div data-testid="volume">{volume}</div>
            <button data-testid="set-high" onClick={() => setVolume(150)}>High</button>
            <button data-testid="set-low" onClick={() => setVolume(-10)}>Low</button>
            <button data-testid="set-normal" onClick={() => setVolume(75)}>Normal</button>
          </div>
        );
      };
      
      render(
        <MusicPlayerProvider>
          <VolumeTestComponent />
        </MusicPlayerProvider>
      );
      
      // Default volume
      expect(screen.getByTestId('volume')).toHaveTextContent('50');
      
      // Test normal value
      await act(async () => {
        fireEvent.click(screen.getByTestId('set-normal'));
      });
      
      expect(screen.getByTestId('volume')).toHaveTextContent('75');
      expect(mockSetVolume).toHaveBeenCalledWith(75);
      
      // Test high value (should clamp to 100)
      mockSetVolume.mockClear();
      await act(async () => {
        fireEvent.click(screen.getByTestId('set-high'));
      });
      
      expect(screen.getByTestId('volume')).toHaveTextContent('100');
      expect(mockSetVolume).toHaveBeenCalledWith(100);
      
      // Test low value (should clamp to 0)
      mockSetVolume.mockClear();
      await act(async () => {
        fireEvent.click(screen.getByTestId('set-low'));
      });
      
      expect(screen.getByTestId('volume')).toHaveTextContent('0');
      expect(mockSetVolume).toHaveBeenCalledWith(0);
    });
  });

  // Group 2: LocalStorage and persistence tests
  describe('Storage and Persistence', () => {
    test('loads tracks from localStorage on initialization', async () => {
      // Set up localStorage with tracks before rendering
      getItemMock.mockImplementation((key) => {
        if (key === 'vibeflo_playlist') {
          return JSON.stringify(getMockTracks());
        }
        if (key === 'vibeflo_current_track') {
          return JSON.stringify(getMockTracks()[0]);
        }
        return null;
      });
      
      render(
        <MusicPlayerProvider>
          <TestComponent />
        </MusicPlayerProvider>
      );
      
      // Wait for effects to run and state to update
      await waitFor(() => {
        expect(screen.getByTestId('track-count')).toHaveTextContent('2 Tracks');
        expect(screen.getByTestId('current-track')).toHaveTextContent('Test Track 1');
      });
    });
    
    test('handles localStorage events from other tabs', async () => {
      render(
        <MusicPlayerProvider>
          <TestComponent />
        </MusicPlayerProvider>
      );
      
      // Verify initial state
      expect(screen.getByTestId('track-count')).toHaveTextContent('0 Tracks');
      
      // Simulate localStorage events with act()
      await act(async () => {
        const playlistEvent = new StorageEvent('storage', {
          key: 'vibeflo_playlist',
          newValue: JSON.stringify(getMockTracks()),
          oldValue: null,
          url: window.location.href
        });
        window.dispatchEvent(playlistEvent);
      });
      
      await act(async () => {
        const currentTrackEvent = new StorageEvent('storage', {
          key: 'vibeflo_current_track',
          newValue: JSON.stringify(getMockTracks()[0]),
          oldValue: null,
          url: window.location.href
        });
        window.dispatchEvent(currentTrackEvent);
      });
      
      // Verify state updates
      await waitFor(() => {
        expect(screen.getByTestId('track-count')).toHaveTextContent('2 Tracks');
        expect(screen.getByTestId('current-track')).toHaveTextContent('Test Track 1');
      });
    });
    
    test('handles custom events for playlist loading', async () => {
      render(
        <MusicPlayerProvider>
          <TestComponent />
        </MusicPlayerProvider>
      );
      
      // Dispatch custom event
      await act(async () => {
        window.dispatchEvent(new CustomEvent('vibeflo_playlist_loaded', {
          detail: {
            tracks: getMockTracks(),
            currentTrack: getMockTracks()[0],
            keepOpen: true
          }
        }));
      });
      
      // Verify state updates
      await waitFor(() => {
        expect(screen.getByTestId('track-count')).toHaveTextContent('2 Tracks');
        expect(screen.getByTestId('current-track')).toHaveTextContent('Test Track 1');
        expect(screen.getByTestId('player-open')).toHaveTextContent('Open');
      });
    });
  });

  // Group 3: Search functionality tests
  describe('Search Functionality', () => {
    test('handles successful search with API key', async () => {
      // Set API key and mock successful response
      process.env.REACT_APP_YOUTUBE_API_KEY = 'mock-api-key';
      
      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: {
          items: [
            {
              id: { videoId: 'result1' },
              snippet: {
                title: 'Search Result 1',
                channelTitle: 'Channel 1',
                thumbnails: {
                  default: { url: 'https://example.com/thumbnail1.jpg' },
                  high: { url: 'https://example.com/thumbnail1_high.jpg' }
                }
              }
            },
            {
              id: { videoId: 'result2' },
              snippet: {
                title: 'Search Result 2',
                channelTitle: 'Channel 2',
                thumbnails: {
                  default: { url: 'https://example.com/thumbnail2.jpg' },
                  high: { url: 'https://example.com/thumbnail2_high.jpg' }
                }
              }
            }
          ]
        }
      });
      
      render(
        <MusicPlayerProvider>
          <TestComponent />
        </MusicPlayerProvider>
      );
      
      // Set search query and perform search
      await act(async () => {
        fireEvent.change(screen.getByTestId('search-input'), { 
          target: { value: 'test query' } 
        });
        
        fireEvent.click(screen.getByTestId('search-btn'));
      });
      
      // Verify search call and results
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          'https://www.googleapis.com/youtube/v3/search',
          expect.objectContaining({
            params: expect.objectContaining({
              q: 'test query',
              key: 'mock-api-key'
            })
          })
        );
        
        expect(screen.getByTestId('search-results-count')).toHaveTextContent('2 results');
      });
    });
    
    test('provides mock results when API key is missing', async () => {
      // Mock console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Ensure API key is unset
      delete process.env.REACT_APP_YOUTUBE_API_KEY;
      
      render(
        <MusicPlayerProvider>
          <TestComponent />
        </MusicPlayerProvider>
      );
      
      // Set search query and perform search
      await act(async () => {
        fireEvent.change(screen.getByTestId('search-input'), { 
          target: { value: 'test query' } 
        });
        
        fireEvent.click(screen.getByTestId('search-btn'));
      });
      
      // Verify error was logged and mock results provided
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('YouTube API key is missing! Search will not work.');
        expect(screen.getByTestId('search-results-count')).toHaveTextContent('3 results');
      });
      
      // Restore console.error
      console.error = originalConsoleError;
    });
    
    test('handles search API errors gracefully', async () => {
      // Set API key
      process.env.REACT_APP_YOUTUBE_API_KEY = 'mock-api-key';
      
      // Mock different error scenarios
      const errorCases = [
        { 
          name: 'general error',
          mock: jest.fn().mockRejectedValueOnce(new Error('API error')),
          expectText: '3 results' // Should fall back to mock results
        },
        {
          name: '403 error',
          mock: jest.fn().mockRejectedValueOnce({
            response: {
              status: 403,
              data: { error: { message: 'API key quota exceeded' } }
            }
          }),
          expectText: '3 results'
        },
        {
          name: 'API data error',
          mock: jest.fn().mockResolvedValueOnce({
            data: {
              error: {
                message: 'YouTube API data error'
              }
            }
          }),
          expectText: '3 results'
        }
      ];
      
      // Test each error case
      for (const { name, mock, expectText } of errorCases) {
        // Reset axios mock
        (axios.get as jest.Mock).mockClear();
        (axios.get as jest.Mock) = mock;
        
        const { unmount } = render(
          <MusicPlayerProvider>
            <TestComponent />
          </MusicPlayerProvider>
        );
        
        // Set search query and perform search
        await act(async () => {
          fireEvent.change(screen.getByTestId('search-input'), { 
            target: { value: `error test ${name}` } 
          });
          
          fireEvent.click(screen.getByTestId('search-btn'));
        });
        
        // Verify fallback to mock results
        await waitFor(() => {
          expect(screen.getByTestId('search-results-count')).toHaveTextContent(expectText);
        });
        
        // Clean up after each sub-test
        unmount();
      }
    });
    
    test('handles empty search query', async () => {
      render(
        <MusicPlayerProvider>
          <TestComponent />
        </MusicPlayerProvider>
      );
      
      // Set empty search query and perform search
      await act(async () => {
        fireEvent.change(screen.getByTestId('search-input'), { 
          target: { value: '' } 
        });
        
        fireEvent.click(screen.getByTestId('search-btn'));
      });
      
      // Verify no API call was made
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  // Group 4: Playlist management
  describe('Playlist Management', () => {
    test('saves playlist to user account', async () => {
      render(
        <MusicPlayerProvider>
          <TestComponent />
        </MusicPlayerProvider>
      );
      
      // Add a track
      await act(async () => {
        fireEvent.click(screen.getByTestId('add-track-btn'));
      });
      
      // Save playlist
      await act(async () => {
        fireEvent.click(screen.getByTestId('save-playlist-btn'));
      });
      
      // Verify API call
      await waitFor(() => {
        expect(playlistAPI.createPlaylist).toHaveBeenCalledWith(
          'Test Playlist',
          expect.any(Array)
        );
      });
    });
    
    test('handles save playlist error', async () => {
      // Mock the toast function
      const toast = require('react-hot-toast').toast;
      
      // Mock API to reject
      (playlistAPI.createPlaylist as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to save playlist')
      );
      
      render(
        <MusicPlayerProvider>
          <TestComponent />
        </MusicPlayerProvider>
      );
      
      // Add a track
      await act(async () => {
        fireEvent.click(screen.getByTestId('add-track-btn'));
      });
      
      // Save playlist
      await act(async () => {
        fireEvent.click(screen.getByTestId('save-playlist-btn'));
      });
      
      // Verify error toast was shown
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save playlist');
      });
    });
  });

  // Group 5: Error handling tests
  describe('Error Handling', () => {
    test('handles missing YouTube player gracefully', async () => {
      // Skip checking for console logs and just verify the component can handle
      // a missing YouTube player without throwing exceptions
      
      // Mock the console.log function to avoid logging to test output
      jest.spyOn(console, 'log').mockImplementation(() => {});
      
      // Create a simple component that triggers play with no player reference
      const TestPlayerComponent = () => {
        const { play } = useMusicPlayer();
        
        return (
          <button 
            data-testid="play-btn" 
            onClick={() => {
              // This should handle missing player gracefully
              play();
            }}
          >
            Play
          </button>
        );
      };
      
      render(
        <MusicPlayerProvider>
          <TestPlayerComponent />
        </MusicPlayerProvider>
      );
      
      // Try to play without a player, this would throw an error if not handled properly
      expect(() => {
        fireEvent.click(screen.getByTestId('play-btn'));
      }).not.toThrow(); // Test passes if no exception is thrown
      
      // Restore original console.log implementation
      jest.restoreAllMocks();
    });
    
    test('handles custom event errors', async () => {
      // Mock console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      render(
        <MusicPlayerProvider>
          <div data-testid="test">Test</div>
        </MusicPlayerProvider>
      );
      
      // Trigger an error by providing invalid data
      await act(async () => {
        window.dispatchEvent(new CustomEvent('vibeflo_playlist_loaded', {
          detail: { tracks: null }
        }));
      });
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error handling custom playlist event'),
        expect.anything()
      );
      
      // Restore console.error
      console.error = originalConsoleError;
    });
  });
}); 