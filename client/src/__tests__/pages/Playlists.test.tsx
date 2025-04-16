import React from 'react';
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Playlists from '../../pages/Playlists';
import { MockAuthProvider } from '../mocks/contexts';
import apiService from '../../services/api';
import { toast } from 'react-hot-toast';

// Mock the API service
jest.mock('../../services/api', () => ({
  playlists: {
    getUserPlaylists: jest.fn(),
    createPlaylist: jest.fn(),
    deletePlaylist: jest.fn(),
  },
}));

// Mock the window.confirm method
window.confirm = jest.fn();

describe('Playlists Component', () => {
  // Mock playlists data
  const mockPlaylists = [
    {
      id: 1,
      name: 'Study Music',
      description: 'Music for studying',
      user_id: 1,
      created_at: '2023-06-01T12:00:00.000Z',
    },
    {
      id: 2,
      name: 'Workout Playlist',
      description: 'Energetic music for workouts',
      user_id: 1,
      created_at: '2023-06-02T12:00:00.000Z',
    },
    {
      id: 3,
      name: 'Relaxing',
      description: null, // Test handling of null description
      user_id: 1,
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
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
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
    (window.confirm as jest.Mock).mockReturnValue(true);
    (apiService.playlists.deletePlaylist as jest.Mock).mockResolvedValue(true);
    
    renderPlaylists();
    
    // Wait for playlists to load
    await waitFor(() => {
      expect(apiService.playlists.getUserPlaylists).toHaveBeenCalledTimes(1);
    });
    
    // Look for delete buttons by their text content
    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Delete');
      
      // Click the first delete button (for "Study Music")
      fireEvent.click(deleteButtons[0]);
      
      // Check that confirm was called
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this playlist?');
      
      // Check that delete API was called
      expect(apiService.playlists.deletePlaylist).toHaveBeenCalledWith('1');
    });
  });

  test('handles playlist view navigation correctly', async () => {
    renderPlaylists();
    
    // Wait for playlists to load
    await waitFor(() => {
      expect(apiService.playlists.getUserPlaylists).toHaveBeenCalledTimes(1);
    });
    
    // Look for links by their text content
    await waitFor(() => {
      const viewLinks = screen.getAllByText('View Songs');
      
      // Check that the links have correct hrefs
      expect(viewLinks[0].closest('a')).toHaveAttribute('href', '/playlist/1');
      expect(viewLinks[1].closest('a')).toHaveAttribute('href', '/playlist/2');
      expect(viewLinks[2].closest('a')).toHaveAttribute('href', '/playlist/3');
    });
  });

  test('creates a new playlist when form is submitted', async () => {
    // Set up a successful playlists fetch
    apiService.playlists.getUserPlaylists.mockResolvedValue(mockPlaylists);
    
    // Set up a successful playlist creation
    const newPlaylist = {
      id: 4,
      name: 'New Test Playlist',
      description: 'Test description',
      user_id: 1,
      created_at: '2023-06-04T12:00:00.000Z'
    };
    apiService.playlists.createPlaylist.mockResolvedValue(newPlaylist);
    
    // Render the component
    renderPlaylists();
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Open the create form
    const createButton = await screen.findByText(/Create Playlist/i);
    fireEvent.click(createButton);
    
    // Fill out the form
    const nameInput = screen.getByLabelText(/Playlist Name/i);
    const descInput = screen.getByLabelText(/Description/i);
    
    fireEvent.change(nameInput, { target: { value: 'New Test Playlist' } });
    fireEvent.change(descInput, { target: { value: 'Test description' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Create/i });
    fireEvent.click(submitButton);
    
    // The updated mock playlists with the new playlist added
    const updatedMockPlaylists = [...mockPlaylists, newPlaylist];
    apiService.playlists.getUserPlaylists.mockResolvedValue(updatedMockPlaylists);
    
    // Wait for the new playlist to appear
    await waitFor(() => {
      expect(screen.getByText('New Test Playlist')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  test('does not create playlist when name is empty', async () => {
    // Mock API calls
    apiService.playlists.getUserPlaylists = jest.fn().mockResolvedValue(mockPlaylists);
    apiService.playlists.createPlaylist = jest.fn();

    render(
      <MemoryRouter>
        <Playlists />
      </MemoryRouter>
    );
    
    // Instead of waiting for removal, wait for playlists to load
    await screen.findByText('Your Playlists');
    
    // Wait for the Create Playlist button to appear
    const createButton = await screen.findByRole('button', { name: /Create Playlist/i });
    fireEvent.click(createButton);
    
    // Find the form elements
    const nameInput = screen.getByLabelText(/Playlist Name \*/i);
    const submitButton = screen.getByRole('button', { name: /Create Playlist$/i });
    
    // Try to submit without entering a name
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.click(submitButton);
    
    // Check that validation error is shown
    expect(screen.getByText(/Playlist name is required/i)).toBeInTheDocument();
    
    // Verify the API was not called to create a playlist
    expect(apiService.playlists.createPlaylist).not.toHaveBeenCalled();
  });

  test('shows error when playlist creation fails', async () => {
    // Mock the createPlaylist method to fail
    const errorMessage = 'Failed to create playlist';
    (apiService.playlists.createPlaylist as jest.Mock).mockRejectedValue({
      response: { data: { message: errorMessage } }
    });
    
    renderPlaylists();
    
    // Wait for playlists to load
    await waitFor(() => {
      expect(apiService.playlists.getUserPlaylists).toHaveBeenCalledTimes(1);
    });
    
    // Open the create form
    const createButton = await screen.findByRole('button', { name: /Create Playlist/i });
    fireEvent.click(createButton);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Playlist Name \*/i), {
      target: { value: 'New Test Playlist' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Create Playlist$/i }));
    
    // Wait for the error to be displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('does not delete playlist when confirmation is canceled', async () => {
    (window.confirm as jest.Mock).mockReturnValue(false);
    
    renderPlaylists();
    
    // Wait for loading state to finish and playlists to be rendered
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      expect(apiService.playlists.getUserPlaylists).toHaveBeenCalledTimes(1);
      // Ensure the playlists are rendered
      expect(screen.getByText('Study Music')).toBeInTheDocument();
    });
    
    // Find delete buttons by their exact text content and role
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    expect(deleteButtons.length).toBeGreaterThan(0);
    
    // Click the first delete button
    fireEvent.click(deleteButtons[0]);
    
    // Confirm cancellation
    expect(window.confirm).toHaveBeenCalled();
    
    // Check that the deletePlaylist API was NOT called
    expect(apiService.playlists.deletePlaylist).not.toHaveBeenCalled();
    
    // All playlists should still be there
    expect(screen.getByText('Study Music')).toBeInTheDocument();
    expect(screen.getByText('Workout Playlist')).toBeInTheDocument();
    expect(screen.getByText('Relaxing')).toBeInTheDocument();
  });

  test('shows error when playlist deletion fails', async () => {
    // Mock the API calls
    apiService.playlists.getUserPlaylists = jest.fn().mockResolvedValue(mockPlaylists);
    apiService.playlists.deletePlaylist = jest.fn().mockRejectedValue({
      response: { status: 500, data: { message: 'Failed to delete playlist' } }
    });
    
    window.confirm = jest.fn().mockReturnValue(true);
    
    render(
      <MemoryRouter>
        <Playlists />
      </MemoryRouter>
    );
    
    // Wait for playlists to be displayed instead of waiting for loading to finish
    await screen.findByText('Your Playlists');
    
    // Click delete on the first playlist
    const deleteButtons = await screen.findAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[0]);
    
    // Confirm the delete
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this playlist?');
    
    // Wait for error message to appear
    const errorMessage = await screen.findByText(/Failed to delete playlist/i);
    expect(errorMessage).toBeInTheDocument();
  });

  test('handles invalid playlist IDs gracefully', async () => {
    // Modify a playlist to have an invalid ID
    const invalidPlaylists = [
      ...mockPlaylists.slice(0, 2),
      { ...mockPlaylists[2], id: NaN },
    ];
    
    (apiService.playlists.getUserPlaylists as jest.Mock).mockResolvedValue(invalidPlaylists);
    
    renderPlaylists();
    
    // Wait for loading state to finish and playlists to be rendered
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      expect(apiService.playlists.getUserPlaylists).toHaveBeenCalledTimes(1);
      // Ensure the playlists are rendered
      expect(screen.getByText('Study Music')).toBeInTheDocument();
    });
    
    // Find view links using more specific selectors
    const viewLinks = screen.getAllByText('View Songs');
    expect(viewLinks.length).toBeGreaterThan(0);
    
    // Click the link for the invalid ID playlist
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    fireEvent.click(viewLinks[2]);
    
    // Should log an error
    expect(consoleSpy).toHaveBeenCalledWith('Invalid playlist ID:', NaN);
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid playlist ID')).toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });
}); 