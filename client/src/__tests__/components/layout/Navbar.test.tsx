import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../../../components/Navbar';

// Mock the useAuth hook
jest.mock('../../../contexts/AuthContext', () => {
  return {
    useAuth: jest.fn()
  };
});

// Import after mocking
import { useAuth } from '../../../contexts/AuthContext';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Navbar Component', () => {
  // Set up mocks before each test
  beforeEach(() => {
    mockNavigate.mockClear();
    jest.clearAllMocks();
  });

  const renderNavbar = () => {
    return render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
  };

  test('renders navbar with logo and basic links when not authenticated', () => {
    // Mock user as not authenticated
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: jest.fn(),
    });
    
    renderNavbar();
    
    // Check for logo
    expect(screen.getByText('VibeFlo')).toBeInTheDocument();
    
    // Check for public links
    expect(screen.getByText('About')).toBeInTheDocument();
    
    // Check for auth links
    const loginButtons = screen.getAllByText(/login/i);
    expect(loginButtons.length).toBeGreaterThan(0);
    
    // Make sure authenticated-only links are not present
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Stats')).not.toBeInTheDocument();
    expect(screen.queryByText('Playlists')).not.toBeInTheDocument();
    expect(screen.queryByText('Themes')).not.toBeInTheDocument();
  });

  test('renders navbar with authenticated user links', () => {
    // Mock authenticated user
    const mockUser = {
      id: '1',
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
    };
    
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: jest.fn(),
    });
    
    renderNavbar();
    
    // Check for logo and public links
    expect(screen.getByText('VibeFlo')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    
    // Check for authenticated user info
    expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    
    // Check for authenticated-only links
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
    expect(screen.getByText('Playlists')).toBeInTheDocument();
    expect(screen.getByText('Themes')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  test('calls logout and navigates when logout button is clicked', () => {
    // Mock authenticated user with logout function
    const mockLogout = jest.fn();
    const mockUser = {
      id: '1',
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
    };
    
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: mockLogout,
    });
    
    renderNavbar();
    
    // Find logout button and click it
    const logoutButton = screen.getByText(/Logout/i);
    fireEvent.click(logoutButton);
    
    // Verify logout was called and navigation happened
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('toggles mobile menu when menu button is clicked', () => {
    // Mock user as not authenticated for simplicity
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: jest.fn(),
    });
    
    renderNavbar();
    
    // Mobile menu button should be visible
    const menuButton = screen.getByLabelText('Open main menu');
    expect(menuButton).toBeInTheDocument();
    
    // Click to open the mobile menu
    fireEvent.click(menuButton);
    
    // Verify that the mobile menu is now visible
    const drawer = screen.getByRole('presentation');
    expect(drawer).toBeInTheDocument();
    
    // Check that the items are visible in the drawer
    const drawerText = within(drawer).getByText('Home');
    expect(drawerText).toBeInTheDocument();
    
    // Check other basic items are in the drawer
    const aboutLink = within(drawer).getByText('About');
    expect(aboutLink).toBeInTheDocument();
    
    const loginLink = within(drawer).getByText('Login');
    expect(loginLink).toBeInTheDocument();
    
    const registerLink = within(drawer).getByText('Register');
    expect(registerLink).toBeInTheDocument();
  });

  test('shows correct authenticated links in mobile menu', () => {
    // Mock authenticated user
    const mockUser = {
      id: '1',
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
    };
    
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: jest.fn(),
    });
    
    renderNavbar();
    
    // Open mobile menu
    const menuButton = screen.getByLabelText('Open main menu');
    fireEvent.click(menuButton);
    
    // Get the drawer element
    const drawer = screen.getByRole('presentation');
    
    // Check for authenticated links in mobile menu
    const dashboardLink = within(drawer).getByText('Dashboard');
    expect(dashboardLink).toBeInTheDocument();
    
    const statsLink = within(drawer).getByText('Stats');
    expect(statsLink).toBeInTheDocument();
    
    const playlistsLink = within(drawer).getByText('Playlists');
    expect(playlistsLink).toBeInTheDocument();
    
    const themesLink = within(drawer).getByText('Themes');
    expect(themesLink).toBeInTheDocument();
    
    // Check for username in mobile menu
    const usernameText = within(drawer).getByText(`@${mockUser.username}`);
    expect(usernameText).toBeInTheDocument();
    
    // Check for logout in mobile menu
    const logoutButton = within(drawer).getByText('Logout');
    expect(logoutButton).toBeInTheDocument();
  });

  test('logs out from mobile menu when clicking logout', () => {
    // Mock authenticated user with logout function
    const mockLogout = jest.fn();
    const mockUser = {
      id: '1',
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
    };
    
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: mockLogout,
    });
    
    renderNavbar();
    
    // Open mobile menu
    const menuButton = screen.getByLabelText('Open main menu');
    fireEvent.click(menuButton);
    
    // Get the drawer element
    const drawer = screen.getByRole('presentation');
    
    // Find logout button in mobile menu and click it
    const logoutButton = within(drawer).getByText('Logout');
    fireEvent.click(logoutButton);
    
    // Verify logout was called and navigation happened
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
}); 