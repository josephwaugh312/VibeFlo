import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { queries, buildQueries, within } from '@testing-library/dom';
import ThemeSelector from '../../pages/ThemeSelector';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { themeAPI } from '../../services/api';

// Custom query to get elements by their 'accept' attribute
const queryAllByAcceptance = (container, acceptance) => {
  return Array.from(container.querySelectorAll(`[accept="${acceptance}"]`));
};

const getMultipleError = (container, acceptance) => 
  `Found multiple elements with accept attribute: ${acceptance}`;
const getMissingError = (container, acceptance) => 
  `Unable to find an element with accept attribute: ${acceptance}`;

const [
  queryByAcceptance,
  getAllByAcceptance,
  getByAcceptance,
  findAllByAcceptance,
  findByAcceptance,
] = buildQueries(queryAllByAcceptance, getMultipleError, getMissingError);

// Add the custom queries to the screen object
const customScreen = {
  ...screen,
  getByAcceptance,
  getAllByAcceptance,
  queryByAcceptance,
  findByAcceptance,
  findAllByAcceptance,
};

// Increase Jest timeout for all tests in this file
jest.setTimeout(15000);

// Mock the ThemeContext with more complete values
jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: 'Midnight',
    setTheme: jest.fn(),
    availableThemes: [
      { id: '1', name: 'Standard Theme 1', image: 'image1.jpg', type: 'standard' },
      { id: '2', name: 'Standard Theme 2', image: 'image2.jpg', type: 'standard' }
    ],
    userThemes: [
      { id: '3', name: 'User Theme 1', image: 'user1.jpg', type: 'user' },
    ],
    publicThemes: [
      { id: '4', name: 'Public Theme 1', image: 'public1.jpg', type: 'public' },
    ],
    loadingThemes: false,
    createCustomTheme: jest.fn(),
    deleteCustomTheme: jest.fn(),
    publishTheme: jest.fn(),
    saveBase64Image: jest.fn(),
    getBase64FromUrl: jest.fn()
  }),
}));

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the API service
jest.mock('../../services/api', () => ({
  themeAPI: {
    getAllThemes: jest.fn(),
    getPublicCustomThemes: jest.fn(),
    getUserCustomThemes: jest.fn(),
    createCustomTheme: jest.fn(),
    updateCustomTheme: jest.fn(),
    deleteCustomTheme: jest.fn(),
    setUserTheme: jest.fn(),
    getUserTheme: jest.fn(),
  },
}));

// Mock confirm dialog
window.confirm = jest.fn();

// Mock FileReader for image uploads
global.FileReader = class {
  onloadend;
  readAsDataURL() {
    setTimeout(() => {
      if (this.onloadend) {
        this.result = 'data:image/jpeg;base64,mockImageData';
        this.onloadend();
      }
    }, 0);
  }
};

// Mute console errors during testing
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn((...args) => {
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('Warning: An update to') || 
       args[0].includes('not wrapped in act'))
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  });
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('ThemeSelector Component', () => {
  // Mock themes data
  const mockStandardThemes = [
    {
      id: 1,
      name: 'Default Theme',
      description: 'A default theme',
      image_url: '/images/themes/default.jpg',
      background_url: '/images/themes/default.jpg',
      is_default: true,
    },
    {
      id: 2,
      name: 'Dark Theme',
      description: 'A dark theme',
      image_url: '/images/themes/dark.jpg',
      background_url: '/images/themes/dark.jpg',
    },
  ];
  
  const mockCommunityThemes = [
    {
      id: 101,
      name: 'Community Theme 1',
      description: 'A community theme',
      image_url: '/images/themes/community1.jpg',
      background_url: '/images/themes/community1.jpg',
      creator_username: 'user1',
      is_public: true,
    },
    {
      id: 102,
      name: 'Community Theme 2',
      description: 'Another community theme',
      image_url: '/images/themes/community2.jpg',
      background_url: '/images/themes/community2.jpg',
      creator_username: 'user2',
      is_public: true,
    },
  ];
  
  const mockUserThemes = [
    {
      id: 201,
      name: 'My Custom Theme',
      description: 'My personal theme',
      image_url: '/images/themes/custom1.jpg',
      background_url: '/images/themes/custom1.jpg',
      is_public: false,
    },
    {
      id: 202,
      name: 'My Public Theme',
      description: 'My shared theme',
      image_url: '/images/themes/custom2.jpg',
      background_url: '/images/themes/custom2.jpg',
      is_public: true,
    },
  ];
  
  const mockCurrentTheme = mockStandardThemes[0];
  const setCurrentThemeMock = jest.fn();
  const setActiveThemeMock = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock useTheme implementation
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: mockCurrentTheme,
      setActiveTheme: setActiveThemeMock,
      setCurrentTheme: setCurrentThemeMock,
    });
    
    // Mock useAuth implementation - authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: 'testuser' },
    });
    
    // Mock API responses
    themeAPI.getAllThemes.mockResolvedValue(mockStandardThemes);
    themeAPI.getPublicCustomThemes.mockResolvedValue(mockCommunityThemes);
    themeAPI.getUserCustomThemes.mockResolvedValue(mockUserThemes);
    themeAPI.setUserTheme.mockResolvedValue({ success: true });
    themeAPI.getUserTheme.mockResolvedValue(mockCurrentTheme);
    themeAPI.createCustomTheme.mockResolvedValue({ 
      id: 203, 
      name: 'New Test Theme', 
      description: 'Test description',
      image_url: '/images/test.jpg',
      background_url: '/images/test.jpg',
    });
    themeAPI.updateCustomTheme.mockResolvedValue({
      id: 201,
      name: 'Updated Test Theme',
      description: 'Updated description',
      image_url: '/images/updated.jpg',
      background_url: '/images/updated.jpg',
    });
    themeAPI.deleteCustomTheme.mockResolvedValue({ success: true });
    
    // Default confirm answer
    (window.confirm as jest.Mock).mockReturnValue(true);
  });

  // Test 1: Renders loading spinner initially
  test('renders loading spinner initially', () => {
    render(<ThemeSelector />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  // Test 2: Renders themes after loading 
  test('renders themes after loading', async () => {
    render(<ThemeSelector />);
    
    // Wait for header to appear, signaling content is loaded
    await waitFor(() => {
      expect(screen.getByText('Background Themes')).toBeInTheDocument();
    });
    
    // Check for the theme tabs
    expect(screen.getByText('Standard Themes')).toBeInTheDocument();
    expect(screen.getByText('Community Themes')).toBeInTheDocument();
    expect(screen.getByText('My Themes')).toBeInTheDocument();
    
    // Check API calls
    expect(themeAPI.getAllThemes).toHaveBeenCalled();
    expect(themeAPI.getPublicCustomThemes).toHaveBeenCalled();
    expect(themeAPI.getUserCustomThemes).toHaveBeenCalled();
    
    // Check that theme names are displayed
    expect(screen.getByText('Default Theme')).toBeInTheDocument();
    expect(screen.getByText('Dark Theme')).toBeInTheDocument();
  });

  // Test 3: Unauthenticated users don't see My Themes tab
  test('unauthenticated users do not see My Themes tab', async () => {
    // Mock unauthenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
    });
    
    render(<ThemeSelector />);
    
    await waitFor(() => {
      expect(screen.getByText('Background Themes')).toBeInTheDocument();
    });
    
    // My Themes tab should not be available
    expect(screen.queryByRole('button', { name: /My Themes/i })).not.toBeInTheDocument();
  });

  // Test 4: Shows error message when API fails
  test('displays error message when API call fails', async () => {
    // Mock API to fail
    themeAPI.getAllThemes.mockRejectedValue(new Error('API error'));
    
    render(<ThemeSelector />);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to refresh themes. Please try again later.')).toBeInTheDocument();
    });
  });
  
  // Test 5: Tab switching
  test('allows switching between tabs', async () => {
    render(<ThemeSelector />);
    
    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Background Themes')).toBeInTheDocument();
    });
    
    // Click on Community Themes tab
    fireEvent.click(screen.getByText('Community Themes'));
    
    // Should show community themes content
    await waitFor(() => {
      expect(screen.getByText('Community Theme 1')).toBeInTheDocument();
      expect(screen.getByText('Created by user1')).toBeInTheDocument();
    });
    
    // Click on My Themes tab
    fireEvent.click(screen.getByText('My Themes'));
    
    // Should show my themes content
    await waitFor(() => {
      expect(screen.getByText('My Custom Theme')).toBeInTheDocument();
      expect(screen.getByText('Create New Theme')).toBeInTheDocument();
    });
  });
  
  // Test 6: Theme selection
  test('allows selecting a theme', async () => {
    render(<ThemeSelector />);
    
    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Background Themes')).toBeInTheDocument();
    });
    
    // Find the Dark Theme card
    await waitFor(() => {
      expect(screen.getByText('Dark Theme')).toBeInTheDocument();
    });
    
    // Based on the actual rendered HTML, the button text is "Select This Theme"
    const selectButtons = screen.getAllByText('Select This Theme');
    expect(selectButtons.length).toBeGreaterThan(0);
    
    // Click the first selection button we find
    fireEvent.click(selectButtons[0]);
    
    // Check that context was updated
    expect(setCurrentThemeMock).toHaveBeenCalled();
    
    // Server call should have been made with some theme ID
    expect(themeAPI.setUserTheme).toHaveBeenCalled();
  });
  
  // Test 7: Creating a new theme
  test('allows creating a new theme', async () => {
    render(<ThemeSelector />);
    
    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Background Themes')).toBeInTheDocument();
    });
    
    // Go to My Themes tab
    fireEvent.click(screen.getByText('My Themes'));
    
    // Click "Create New Theme" button
    await waitFor(() => {
      expect(screen.getByText('Create New Theme')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Create New Theme'));
    
    // Wait for modal to appear and check if it contains the theme name input
    await waitFor(() => {
      const modal = screen.getByRole('heading', { name: 'Create New Theme' });
      expect(modal).toBeInTheDocument();
      
      // Check for the name input
      const nameInput = screen.getByPlaceholderText('Enter theme name');
      expect(nameInput).toBeInTheDocument();
    });
    
    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText('Enter theme name'), {
      target: { value: 'My Test Theme' }
    });
    
    fireEvent.change(screen.getByPlaceholderText('Enter theme description'), {
      target: { value: 'A theme for testing' }
    });
    
    fireEvent.change(screen.getByPlaceholderText('Enter image URL'), {
      target: { value: 'https://example.com/image.jpg' }
    });
    
    // Toggle the "Share with community" checkbox
    fireEvent.click(screen.getByText('Share with the community'));
    
    // Submit the form by clicking the create button
    fireEvent.click(screen.getByRole('button', { name: 'Create Theme' }));
    
    // Check API was called correctly
    await waitFor(() => {
      expect(themeAPI.createCustomTheme).toHaveBeenCalledWith(expect.objectContaining({
        name: 'My Test Theme',
        description: 'A theme for testing',
        image_url: 'https://example.com/image.jpg',
        is_public: true
      }));
    });
    
    // Check that context was updated with the new theme
    expect(setCurrentThemeMock).toHaveBeenCalled();
  });
  
  // Test 8: Editing a theme
  test('allows editing a theme', async () => {
    render(<ThemeSelector />);
    
    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Background Themes')).toBeInTheDocument();
    });
    
    // Go to My Themes tab
    fireEvent.click(screen.getByText('My Themes'));
    
    // Wait for my themes to load
    await waitFor(() => {
      expect(screen.getByText('My Custom Theme')).toBeInTheDocument();
    });
    
    // Find all edit buttons and click the first one (assuming there's one next to My Custom Theme)
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    // Wait for edit modal to appear with theme data pre-filled
    await waitFor(() => {
      const modal = screen.getByRole('heading', { name: 'Edit Theme' });
      expect(modal).toBeInTheDocument();
      
      // Check if the name input has been pre-filled
      const nameInput = screen.getByPlaceholderText('Enter theme name') as HTMLInputElement;
      expect(nameInput.value).toBe('My Custom Theme');
    });
    
    // Update the name
    fireEvent.change(screen.getByPlaceholderText('Enter theme name'), {
      target: { value: 'Updated Theme Name' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Update Theme'));
    
    // Check API was called correctly
    await waitFor(() => {
      expect(themeAPI.updateCustomTheme).toHaveBeenCalledWith(
        201, // theme ID
        expect.objectContaining({
          name: 'Updated Theme Name',
        })
      );
    });
  });
  
  // Test 9: Deleting a theme
  test('allows deleting a theme with confirmation', async () => {
    render(<ThemeSelector />);
    
    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Background Themes')).toBeInTheDocument();
    });
    
    // Go to My Themes tab
    fireEvent.click(screen.getByText('My Themes'));
    
    // Wait for my themes to load
    await waitFor(() => {
      expect(screen.getByText('My Custom Theme')).toBeInTheDocument();
    });
    
    // Find all delete buttons and click the first one
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    // Should show confirmation dialog
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this theme?');
    
    // Check API was called correctly
    await waitFor(() => {
      expect(themeAPI.deleteCustomTheme).toHaveBeenCalledWith(201);
    });
  });
  
  // Test 10: Cancel theme deletion
  test('cancels theme deletion when user declines confirmation', async () => {
    // Mock user cancelling the confirmation
    (window.confirm as jest.Mock).mockReturnValueOnce(false);
    
    render(<ThemeSelector />);
    
    // Wait for content to load and go to My Themes tab
    await waitFor(() => {
      expect(screen.getByText('Background Themes')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('My Themes'));
    
    // Wait for my themes to load
    await waitFor(() => {
      expect(screen.getByText('My Custom Theme')).toBeInTheDocument();
    });
    
    // Find all delete buttons and click the first one
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    // Should show confirmation dialog
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this theme?');
    
    // API should NOT be called since user cancelled
    expect(themeAPI.deleteCustomTheme).not.toHaveBeenCalled();
  });
  
  // Test 11: Uploading an image
  test('allows uploading an image for a new theme', async () => {
    render(<ThemeSelector />);
    
    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Background Themes')).toBeInTheDocument();
    });
    
    // Go to My Themes tab and open create modal
    fireEvent.click(screen.getByText('My Themes'));
    
    await waitFor(() => {
      expect(screen.getByText('Create New Theme')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Create New Theme'));
    
    // Wait for modal
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Create New Theme' })).toBeInTheDocument();
    });
    
    // Use our custom query to find the file input
    const fileInput = document.querySelector('input[type="file"][accept="image/*"]');
    expect(fileInput).not.toBeNull();
    
    // Create a mock file and trigger upload
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    
    if (fileInput) {
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
    }
    
    // Fill name field which is required
    fireEvent.change(screen.getByPlaceholderText('Enter theme name'), {
      target: { value: 'Image Upload Theme' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Create Theme'));
    
    // Check that API was called (the image would be processed in the component)
    await waitFor(() => {
      expect(themeAPI.createCustomTheme).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Image Upload Theme',
      }));
    });
  });
  
  // Test 12: Validation errors in theme creation
  test('shows validation errors when creating a theme without name', async () => {
    render(<ThemeSelector />);
    
    // Wait for content to load and go to My Themes tab
    await waitFor(() => {
      expect(screen.getByText('Background Themes')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('My Themes'));
    
    await waitFor(() => {
      expect(screen.getByText('Create New Theme')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Create New Theme'));
    
    // Wait for modal
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Create New Theme' })).toBeInTheDocument();
    });
    
    // Submit without filling required fields
    fireEvent.click(screen.getByText('Create Theme'));
    
    // Should show error
    await waitFor(() => {
      expect(screen.getByText('Theme name is required')).toBeInTheDocument();
    });
    
    // API should not be called
    expect(themeAPI.createCustomTheme).not.toHaveBeenCalled();
  });
  
  // Test 13: Validation errors for missing image
  test('shows validation errors when creating a theme without image', async () => {
    render(<ThemeSelector />);
    
    // Wait for content to load and go to My Themes tab
    await waitFor(() => {
      expect(screen.getByText('Background Themes')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('My Themes'));
    
    await waitFor(() => {
      expect(screen.getByText('Create New Theme')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Create New Theme'));
    
    // Wait for modal
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Create New Theme' })).toBeInTheDocument();
    });
    
    // Fill name but no image
    fireEvent.change(screen.getByPlaceholderText('Enter theme name'), {
      target: { value: 'No Image Theme' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Create Theme'));
    
    // Should show error about missing image
    await waitFor(() => {
      expect(screen.getByText('Please provide an image URL or upload an image')).toBeInTheDocument();
    });
    
    // API should not be called
    expect(themeAPI.createCustomTheme).not.toHaveBeenCalled();
  });
}); 