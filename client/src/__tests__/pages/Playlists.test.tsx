import React from 'react';
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Playlists from '../../pages/Playlists';
import { MockAuthProvider } from '../mocks/contexts';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

// Mock the API service
jest.mock('../../services/api', () => ({
  playlists: {
    getUserPlaylists: jest.fn(),
    createPlaylist: jest.fn(),
    deletePlaylist: jest.fn(),
  },
}));

// Mock toast notifications
jest.mock('react-hot-toast', () => {
  return {
    success: jest.fn(),
    error: jest.fn(),
  };
});

// Mock window.confirm
const originalConfirm = window.confirm;
window.confirm = jest.fn();

describe('Playlists Component', () => {
  // Mock playlists data
  const mockPlaylists = [
    {
      id: '1',
      name: 'Study Music',
      description: 'Music for studying',
      user_id: '1',
      created_at: '2023-06-01T12:00:00.000Z',
    },
    {
      id: '2',
      name: 'Workout Playlist',
      description: 'Energetic music for workouts',
      user_id: '1',
      created_at: '2023-06-02T12:00:00.000Z',
    },
    {
      id: '3',
      name: 'Relaxing',
      description: null, // Test handling of null description
      user_id: '1',
      created_at: '2023-06-03T12:00:00.000Z',
    },
  ];

  // Mock user data
  const mockUser = {
    id: '1',
    username: 'testuser',
    name: 'Test User',
    email: 'test@example.com',
  };

  // Setup helper function to render the Playlists with our mocks
  const renderPlaylists = ({ user = mockUser, isAuthenticated = true } = {}) => {
    return render(
      <MemoryRouter>
        <MockAuthProvider
          value={{
            user,
            isAuthenticated,
            login: jest.fn(),
            register: jest.fn(),
            logout: jest.fn(),
            checkAuthStatus: jest.fn(),
            setUser: jest.fn(),
            isLoading: false,
            passwordResetToken: null,
            sendPasswordResetEmail: jest.fn(),
            resetPassword: jest.fn(),
          }}
        >
          <Playlists />
        </MockAuthProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up the mock implementation for getUserPlaylists
    (apiService.playlists.getUserPlaylists as jest.Mock).mockResolvedValue(mockPlaylists);
    // Reset window.confirm mock
    (window.confirm as jest.Mock).mockReset();
  });

  afterAll(() => {
    window.confirm = originalConfirm;
  });

  test('renders playlists page with title', async () => {
    renderPlaylists();
    
    // Wait for playlists to load
    await waitFor(() => {
      expect(apiService.playlists.getUserPlaylists).toHaveBeenCalledTimes(1);
    });
    
    // Check for page title
    expect(screen.getByText(/Your Playlists/i)).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    renderPlaylists();
    
    // Check for loading animation by looking for the spinning element's class
    expect(screen.getByText(/Your Playlists/i)).toBeInTheDocument();
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
  });

  test('displays error message when playlists fetch fails', async () => {
    const errorMessage = 'Failed to load playlists';
    
    // Mock the API to return an error
    (apiService.playlists.getUserPlaylists as jest.Mock).mockRejectedValue({
      response: { data: { message: errorMessage } }
    });
    
    renderPlaylists();
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('displays server error message when server error occurs', async () => {
    // Mock the API to return a server error
    (apiService.playlists.getUserPlaylists as jest.Mock).mockRejectedValue({
      response: { status: 500 }
    });
    
    renderPlaylists();
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Server error: Please try again later/i)).toBeInTheDocument();
    });
  });

  test('renders playlists when data is loaded', async () => {
    renderPlaylists();
    
    // Wait for playlists to load
    await waitFor(() => {
      expect(apiService.playlists.getUserPlaylists).toHaveBeenCalledTimes(1);
    });
    
    // Update the test to match the actual implementation
    await waitFor(() => {
      // Check that playlists are displayed
      expect(screen.getByText('Study Music')).toBeInTheDocument();
      expect(screen.getByText('Workout Playlist')).toBeInTheDocument();
      expect(screen.getByText('Relaxing')).toBeInTheDocument();
      
      // Check that descriptions are displayed
      expect(screen.getByText('Music for studying')).toBeInTheDocument();
      expect(screen.getByText('Energetic music for workouts')).toBeInTheDocument();
    });
  });

  test('shows empty state when no playlists exist', async () => {
    // Mock the API to return an empty array
    (apiService.playlists.getUserPlaylists as jest.Mock).mockResolvedValue([]);
    
    renderPlaylists();
    
    // Wait for loading state to finish
    await waitFor(() => {
      // First check that the loading spinner is no longer visible
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      // Then check that the API call was made
      expect(apiService.playlists.getUserPlaylists).toHaveBeenCalledTimes(1);
    });
    
    // Check for empty state message
    expect(screen.getByText("You don't have any playlists yet.")).toBeInTheDocument();
    expect(screen.getByText("Create Your First Playlist")).toBeInTheDocument();
  });

  test('toggles create playlist form when button is clicked', async () => {
    // Set up a successful playlists fetch
    apiService.playlists.getUserPlaylists.mockResolvedValue(mockPlaylists);
    
    // Render the component
    renderPlaylists();
    
    // Wait for loading to finish and the create button to appear
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
    
    // Check that the create button is there
    const createButton = await screen.findByText(/Create Playlist/i);
    expect(createButton).toBeInTheDocument();
    
    // Click the create button
    fireEvent.click(createButton);
    
    // Check that the form appears
    expect(screen.getByText('Create New Playlist')).toBeInTheDocument();
    expect(screen.getByLabelText(/Playlist Name/i)).toBeInTheDocument();
    
    // Check that the create button is now "Cancel"
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    
    // Click cancel
    fireEvent.click(screen.getByText('Cancel'));
    
    // Check that the form is gone
    await waitFor(() => {
      expect(screen.queryByText('Create New Playlist')).not.toBeInTheDocument();
    });
    
    // Check that the create button is back
    expect(screen.getByText(/Create Playlist/i)).toBeInTheDocument();
  });

  test('deletes a playlist when delete button is clicked and confirmed', async () => {
    // Mock confirm to return true (user confirms deletion)
    (window.confirm as jest.Mock).mockReturnValue(true);
    
    // Mock the deletePlaylist function
    (apiService.playlists.deletePlaylist as jest.Mock).mockResolvedValue(true);
    
    renderPlaylists();
    
    // Wait for playlists to load
    await waitFor(() => {
      expect(apiService.playlists.getUserPlaylists).toHaveBeenCalledTimes(1);
    });
    
    // Find all delete buttons
    const deleteButtons = await screen.findAllByText('Delete');
    expect(deleteButtons.length).toBeGreaterThan(0);
    
    // Click the first delete button (for "Study Music")
    fireEvent.click(deleteButtons[0]);
    
    // Check that confirm was called
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this playlist?');
    
    // Check that delete API was called
    expect(apiService.playlists.deletePlaylist).toHaveBeenCalledWith('1');
    
    // Verify toast success was called
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Playlist deleted successfully');
    });
  });

  test('does not delete playlist when confirmation is canceled', async () => {
    // Mock confirm to return false (user cancels deletion)
    (window.confirm as jest.Mock).mockReturnValue(false);
    
    renderPlaylists();
    
    // Wait for playlists to load
    await waitFor(() => {
      expect(apiService.playlists.getUserPlaylists).toHaveBeenCalledTimes(1);
    });
    
    // Find all delete buttons
    const deleteButtons = await screen.findAllByText('Delete');
    expect(deleteButtons.length).toBeGreaterThan(0);
    
    // Click the first delete button
    fireEvent.click(deleteButtons[0]);
    
    // Confirm cancellation
    expect(window.confirm).toHaveBeenCalled();
    
    // Check that the deletePlaylist API was NOT called
    expect(apiService.playlists.deletePlaylist).not.toHaveBeenCalled();
  });

  test('shows error when playlist deletion fails', async () => {
    // Mock confirm to return true
    (window.confirm as jest.Mock).mockReturnValue(true);
    
    // Mock deletion to fail
    (apiService.playlists.deletePlaylist as jest.Mock).mockRejectedValue(new Error('Failed to delete'));
    
    renderPlaylists();
    
    // Wait for playlists to load
    await waitFor(() => {
      expect(apiService.playlists.getUserPlaylists).toHaveBeenCalledTimes(1);
    });
    
    // Find all delete buttons
    const deleteButtons = await screen.findAllByText('Delete');
    
    // Click the first delete button
    fireEvent.click(deleteButtons[0]);
    
    // Confirm the delete
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this playlist?');
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to delete playlist');
    });
    
    // Error should be in the document
    expect(screen.queryByText(/Failed to delete playlist/i)).toBeInTheDocument();
  });

  test('handles invalid playlist IDs gracefully', async () => {
    // Create a malformed playlist with NaN ID
    const badPlaylists = [
      ...mockPlaylists,
      {
        id: 'NaN',
        name: 'Bad Playlist',
        description: 'Has an invalid ID',
        user_id: '1',
        created_at: '2023-06-04T12:00:00.000Z',
      },
    ];
    
    // Mock the API to return our bad playlists
    (apiService.playlists.getUserPlaylists as jest.Mock).mockResolvedValue(badPlaylists);
    
    // Mock console.error to track calls
    const consoleSpy = jest.spyOn(console, 'error');
    consoleSpy.mockImplementation(() => {});
    
    // Mock window.confirm to return true
    (window.confirm as jest.Mock).mockReturnValue(true);
    
    renderPlaylists();
    
    // Wait for playlists to load
    await waitFor(() => {
      expect(apiService.playlists.getUserPlaylists).toHaveBeenCalledTimes(1);
    });
    
    // There should be four playlists including our bad one
    await waitFor(() => {
      expect(screen.getByText('Bad Playlist')).toBeInTheDocument();
    });
    
    // Find all delete buttons
    const deleteButtons = await screen.findAllByText('Delete');
    
    // Click the delete button for the bad playlist (should be the last one)
    fireEvent.click(deleteButtons[3]);
    
    // Should log an error
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error deleting playlist:', expect.anything());
    });
    
    // Clean up
    consoleSpy.mockRestore();
  });

  test('handles playlist view navigation correctly', async () => {
    renderPlaylists();
    
    // Wait for playlists to load
    await waitFor(() => {
      expect(apiService.playlists.getUserPlaylists).toHaveBeenCalledTimes(1);
    });
    
    // Look for View Songs links
    const viewLinks = await screen.findAllByText('View Songs');
    expect(viewLinks.length).toBe(3);
    
    // Check that the links have correct hrefs
    expect(viewLinks[0].getAttribute('href')).toBe('/playlist/1');
    expect(viewLinks[1].getAttribute('href')).toBe('/playlist/2');
    expect(viewLinks[2].getAttribute('href')).toBe('/playlist/3');
  });
}); 