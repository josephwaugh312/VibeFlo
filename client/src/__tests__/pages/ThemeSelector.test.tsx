import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeSelector from '../../pages/ThemeSelector';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { themeAPI } from '../../services/api';

// Mock the theme context
jest.mock('../../context/ThemeContext', () => ({
  useTheme: jest.fn(),
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
    
    // Default confirm answer
    window.confirm = jest.fn().mockReturnValue(true);
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
    
    // Check API calls
    expect(themeAPI.getAllThemes).toHaveBeenCalled();
    expect(themeAPI.getPublicCustomThemes).toHaveBeenCalled();
    expect(themeAPI.getUserCustomThemes).toHaveBeenCalled();
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
}); 