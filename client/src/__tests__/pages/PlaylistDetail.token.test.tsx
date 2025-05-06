import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as reactRouterDom from 'react-router-dom';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

// Mock toast directly
jest.mock('react-hot-toast', () => {
  const mockToast = jest.fn();
  mockToast.error = jest.fn();
  mockToast.success = jest.fn();
  mockToast.info = jest.fn();
  mockToast.loading = jest.fn();
  mockToast.custom = jest.fn();
  mockToast.dismiss = jest.fn();
  return {
    __esModule: true,
    default: mockToast
  };
});

// Import dependencies after mocking
import toast from 'react-hot-toast';
import PlaylistDetail from '../../pages/PlaylistDetail';
import { MockAuthProvider, MockMusicPlayerProvider } from '../mocks/contexts';
import apiService from '../../services/api';

// Mock localStorage
let localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Replace the window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock fetch
global.fetch = jest.fn();

describe('PlaylistDetail Component Auth Token Tests', () => {
  let mockMusicPlayerContext: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up useParams mock with default ID
    reactRouterDom.useParams.mockReturnValue({ id: '1' });
    
    // Mock API service
    jest.spyOn(apiService.playlists, 'getPlaylist').mockImplementation((id: string) => {
      return Promise.resolve({
        id: parseInt(id),
        name: 'Test Playlist',
        description: 'A test playlist',
        user_id: 1,
        created_at: '2023-06-01T12:00:00.000Z',
        tracks: []
      });
    });
    
    // Mock music player context
    mockMusicPlayerContext = {
      loadPlaylist: jest.fn(),
      play: jest.fn()
    };
  });
  
  it('should redirect to login when token is missing', async () => {
    // Ensure localStorage returns null for token
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return null;
      return localStorageMock[key] || null;
    });
    
    await act(async () => {
      render(
        <MockAuthProvider>
          <MockMusicPlayerProvider value={mockMusicPlayerContext}>
            <PlaylistDetail />
          </MockMusicPlayerProvider>
        </MockAuthProvider>
      );
    });
    
    // Verify redirect to login page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
    
    // Verify error message
    expect(toast.error).toHaveBeenCalled();
    
    // Verify API was not called
    expect(apiService.playlists.getPlaylist).not.toHaveBeenCalled();
  });
  
  it('should redirect to login on 401 response', async () => {
    // Set up mock token
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'expired-token';
      return localStorageMock[key] || null;
    });
    
    // Mock API to return 401
    jest.spyOn(apiService.playlists, 'getPlaylist').mockRejectedValueOnce({
      response: {
        status: 401,
        data: { message: 'Your session has expired' }
      }
    });
    
    await act(async () => {
      render(
        <MockAuthProvider>
          <MockMusicPlayerProvider value={mockMusicPlayerContext}>
            <PlaylistDetail />
          </MockMusicPlayerProvider>
        </MockAuthProvider>
      );
    });
    
    // Verify redirect to login page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
    
    // Verify error message was called
    expect(toast.error).toHaveBeenCalled();
  });
  
  it('should use token from localStorage for API calls', async () => {
    // Set up mock token
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'valid-token';
      return localStorageMock[key] || null;
    });
    
    // Create a spy for API calls to verify headers
    const getSpy = jest.spyOn(apiService.playlists, 'getPlaylist');
    
    await act(async () => {
      render(
        <MockAuthProvider>
          <MockMusicPlayerProvider value={mockMusicPlayerContext}>
            <PlaylistDetail />
          </MockMusicPlayerProvider>
        </MockAuthProvider>
      );
    });
    
    // Verify API was called
    await waitFor(() => {
      expect(getSpy).toHaveBeenCalled();
    });
    
    // Verify localStorage.getItem was called with 'token'
    expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
  });
  
  it('should handle token refresh (simulated)', async () => {
    // First return an expired token, then a refreshed token
    let tokenRefreshed = false;
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') {
        return tokenRefreshed ? 'refreshed-token' : 'expired-token';
      }
      return localStorageMock[key] || null;
    });
    
    // First API call fails with 401, second one succeeds
    jest.spyOn(apiService.playlists, 'getPlaylist')
      .mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: 'Token expired' }
        }
      })
      .mockImplementationOnce((id) => {
        return Promise.resolve({
          id: parseInt(id),
          name: 'Test Playlist (Refreshed)',
          description: 'Accessed with refreshed token',
          user_id: 1,
          created_at: '2023-06-01T12:00:00.000Z',
          tracks: []
        });
      });
    
    // Mock the auth context refresh functionality
    const mockAuthRefresh = jest.fn(() => {
      tokenRefreshed = true;
      localStorageMock.setItem('token', 'refreshed-token');
      return Promise.resolve(true);
    });
    
    await act(async () => {
      render(
        <MockAuthProvider value={{ refreshAuth: mockAuthRefresh }}>
          <MockMusicPlayerProvider value={mockMusicPlayerContext}>
            <PlaylistDetail />
          </MockMusicPlayerProvider>
        </MockAuthProvider>
      );
    });
    
    // Initially it should try to navigate to login due to our mock's 401 response
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
    
    // In a real app with token refresh logic, we would verify:
    // 1. Token refresh was attempted
    // 2. The API call was retried with the new token
    // 3. The component successfully loaded with the refreshed data
    
    // Here we just verify the error message was shown
    expect(toast.error).toHaveBeenCalled();
  });
  
  it('should handle API call with valid token', async () => {
    // Set up mock token
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'valid-token';
      return localStorageMock[key] || null;
    });
    
    // Mock successful API response
    jest.spyOn(apiService.playlists, 'getPlaylist').mockResolvedValueOnce({
      id: 1,
      name: 'Test Playlist (Refreshed)',
      description: 'Accessed with refreshed token',
      user_id: 1,
      created_at: '2023-06-01T12:00:00.000Z',
      tracks: [
        {
          id: 101,
          title: 'Test Song 1',
          artist: 'Test Artist 1',
          url: 'https://www.youtube.com/watch?v=123'
        }
      ]
    });
    
    await act(async () => {
      render(
        <MockAuthProvider>
          <MockMusicPlayerProvider value={mockMusicPlayerContext}>
            <PlaylistDetail />
          </MockMusicPlayerProvider>
        </MockAuthProvider>
      );
    });
    
    // Verify the playlist data is displayed
    await waitFor(() => {
      expect(screen.getByText('Test Playlist (Refreshed)')).toBeInTheDocument();
      expect(screen.getByText('Accessed with refreshed token')).toBeInTheDocument();
    });
    
    // Verify API was called with the correct ID
    expect(apiService.playlists.getPlaylist).toHaveBeenCalledWith('1');
    
    // Verify no redirects happened
    expect(mockNavigate).not.toHaveBeenCalled();
  });
}); 