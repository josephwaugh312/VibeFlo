// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock the react-router-dom Navigate component
jest.mock('react-router-dom', () => {
  const mockNavigate = jest.fn();
  return {
    Navigate: jest.fn(({ to }) => {
      mockNavigate(to);
      return null;
    }),
    mockNavigate
  };
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrivateRoute from '../../components/PrivateRoute';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, mockNavigate } from 'react-router-dom';

describe('PrivateRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when user is authenticated', () => {
    // Mock authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false
    });
    
    render(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>
    );
    
    // Protected content should be visible
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('does not render children and shows loader when isLoading is true', () => {
    // Mock loading auth state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: true
    });
    
    render(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>
    );
    
    // Check that the loading spinner is present
    const loadingSpinner = screen.getByRole('progressbar');
    expect(loadingSpinner).toBeInTheDocument();
    
    // Protected content should not be present
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
  
  it('redirects when user is not authenticated', () => {
    // Mock unauthenticated user
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false
    });
    
    render(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>
    );
    
    // Verify the Navigate component was called with the correct props
    expect(Navigate).toHaveBeenCalledWith(
      {
        to: '/login',
        replace: true
      },
      undefined
    );
    
    // Protected content should not be present
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
}); 