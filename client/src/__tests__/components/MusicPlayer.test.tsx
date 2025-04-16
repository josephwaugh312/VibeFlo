import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MusicPlayer, { Track } from '../../components/music/MusicPlayer';
import * as MusicPlayerContext from '../../contexts/MusicPlayerContext';
import { BrowserRouter } from 'react-router-dom';

// Mock React YouTube
jest.mock('react-youtube', () => {
  return function MockYouTube() {
    return <div data-testid="youtube-player">YouTube Player</div>;
  };
});

// Mock tracks
const mockTracks: Track[] = [
  {
    id: '1',
    title: 'Test Track 1',
    artist: 'Test Artist 1',
    url: 'https://www.youtube.com/watch?v=test1',
    artwork: 'https://example.com/artwork1.jpg',
    source: 'youtube'
  },
  {
    id: '2',
    title: 'Test Track 2',
    artist: 'Test Artist 2',
    url: 'https://www.youtube.com/watch?v=test2',
    artwork: 'https://example.com/artwork2.jpg',
    source: 'youtube'
  }
];

// Mock context values
const mockContextValue = {
  tracks: mockTracks,
  currentTrack: mockTracks[0],
  isPlaying: false,
  volume: 50,
  currentTime: 0,
  duration: 0,
  isOpen: true,
  isMinimized: false,
  currentTab: 'nowPlaying',
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  addTrack: jest.fn(),
  removeTrack: jest.fn(),
  playTrack: jest.fn(),
  togglePlay: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  playPrevious: jest.fn(),
  playNext: jest.fn(),
  seek: jest.fn(),
  setVolume: jest.fn(),
  toggleOpen: jest.fn(),
  toggleMinimize: jest.fn(),
  setCurrentTab: jest.fn(),
  setSearchQuery: jest.fn(),
  handleSearch: jest.fn(),
  savePlaylistToAccount: jest.fn(),
  setPlayerReference: jest.fn()
};

// Wrapper component
const renderWithProviders = (ui: React.ReactElement, contextOverrides = {}) => {
  const mockUseMusicPlayer = jest.spyOn(MusicPlayerContext, 'useMusicPlayer');
  // Merge default mock values with any overrides
  mockUseMusicPlayer.mockReturnValue({
    ...mockContextValue,
    ...contextOverrides
  });
  
  return render(
    <BrowserRouter data-testid="browser-router">
      {ui}
    </BrowserRouter>
  );
};

describe('React Router DOM Mock Library', () => {
  it('exists as a module', () => {
    expect(BrowserRouter).toBeDefined();
  });
});

describe('MusicPlayer Component', () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(MusicPlayerContext, 'useMusicPlayer').mockImplementation(() => mockContextValue);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the player button when closed', () => {
    // Override isOpen to false for this test
    renderWithProviders(<MusicPlayer />, { isOpen: false });
    
    // Check for the floating player button
    expect(screen.getByTestId('music-player-button')).toBeInTheDocument();
  });

  it('renders the player panel when open', () => {
    renderWithProviders(<MusicPlayer />);
    
    // Check that the player container is visible
    expect(screen.getByTestId('music-player-container')).toBeInTheDocument();
  });

  it('renders tabs for navigation', () => {
    renderWithProviders(<MusicPlayer />);
    
    // Check the tabs using test IDs
    expect(screen.getByTestId('tab-nowPlaying')).toBeInTheDocument();
    expect(screen.getByTestId('tab-playlist')).toBeInTheDocument();
    expect(screen.getByTestId('tab-search')).toBeInTheDocument();
  });

  it('renders current track information', () => {
    renderWithProviders(<MusicPlayer />);
    
    // Check track info is displayed
    expect(screen.getByText('Test Track 1')).toBeInTheDocument();
    expect(screen.getByText('Test Artist 1')).toBeInTheDocument();
  });

  it('calls play when play button is clicked', () => {
    const mockPlay = jest.fn();
    
    // Render with custom play mock
    const view = renderWithProviders(<MusicPlayer />, { 
      play: mockPlay,
      isMinimized: true, // Use minimized view to ensure play button is visible
      currentTrack: mockTracks[0], // Make sure we have a track
      isPlaying: false // Ensure the play button is showing (not the pause button)
    });
    
    // Find and click the play button in minimized view
    const playButton = screen.getByTestId('play-button');
    fireEvent.click(playButton);
    
    // Verify play was called
    expect(mockPlay).toHaveBeenCalled();
  });
}); 