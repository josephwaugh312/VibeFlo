import React from 'react';
import { render, screen, act, within } from '@testing-library/react';
import App from './App';

// Mock the theme contexts to avoid API calls
jest.mock('./context/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({
    currentTheme: null,
    loading: false,
    availableThemes: [],
    customThemes: [],
    publicCustomThemes: []
  })
}));

// Mock the auth context to avoid API calls
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null
  })
}));

describe('App Component', () => {
  it('renders the app logo and navigation elements', async () => {
    await act(async () => {
      render(<App />);
    });
    
    // Look for the app logo specifically in the header area
    const appHeader = screen.getAllByRole('banner')[0];
    const appLogo = within(appHeader).getByText('VibeFlo');
    expect(appLogo).toBeInTheDocument();
    
    // Check for navigation elements
    const loginButton = screen.getAllByText(/login/i)[0]; // Get the first login button
    expect(loginButton).toBeInTheDocument();
    
    const registerButton = screen.getAllByText(/register/i)[0]; // Get the first register button
    expect(registerButton).toBeInTheDocument();
    
    const aboutButton = screen.getByRole('link', { name: /about/i });
    expect(aboutButton).toBeInTheDocument();
  });
});
