// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, mockNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';

describe('Navbar Component', () => {
  // Helper function to set auth context mock values
  const setupAuthContext = (isAuthenticated: boolean, user: any = null) => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated,
      user,
      logout: jest.fn().mockImplementation(() => {
        // Mock implementation to test logout behavior
        return Promise.resolve();
      })
    });
  };

  // Helper to render with router
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    );
  };

  it('renders the logo/brand link', () => {
    setupAuthContext(false);
    renderWithRouter(<Navbar />);
    
    const brandLink = screen.getByText('VibeFlo');
    expect(brandLink).toBeInTheDocument();
    expect(brandLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders login and register buttons when user is not authenticated', () => {
    setupAuthContext(false);
    renderWithRouter(<Navbar />);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    
    // Check that authenticated-only links are not present
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('renders user-specific navigation when authenticated', () => {
    setupAuthContext(true, { username: 'testuser' });
    renderWithRouter(<Navbar />);
    
    // Check that auth-specific links are present
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
    expect(screen.getByText('Playlists')).toBeInTheDocument();
    expect(screen.getByText('Themes')).toBeInTheDocument();
    
    // Check username and logout are visible
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    
    // Login/Register should not be visible
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
  });

  it('displays avatar with user initial when no avatarUrl is provided', () => {
    setupAuthContext(true, { 
      username: 'testuser',
      name: 'Test User'
    });
    renderWithRouter(<Navbar />);
    
    // The avatar should contain the initial 'T'
    const avatarElement = screen.getByText('T');
    expect(avatarElement).toBeInTheDocument();
  });

  it('calls logout and navigates when logout button is clicked', () => {
    const mockLogout = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { username: 'testuser' },
      logout: mockLogout
    });
    
    renderWithRouter(<Navbar />);
    
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
}); 