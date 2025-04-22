import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  setToken: jest.fn(),
  auth: {
    login: jest.fn(),
    register: jest.fn(),
    getCurrentUser: jest.fn(),
  },
  default: {
    setToken: jest.fn(),
  },
}));

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

describe('AuthContext', () => {
  // Create a test component that uses the auth context
  const TestComponent = () => {
    const { isAuthenticated, loading, user, login, register, logout, error, clearError } = useAuth();
    
    return (
      <div>
        <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
        <div data-testid="loading-status">{loading ? 'Loading' : 'Not Loading'}</div>
        <div data-testid="user-data">{user ? JSON.stringify(user) : 'No User'}</div>
        <div data-testid="error-message">{error || 'No Error'}</div>
        
        <button data-testid="login-button" onClick={async () => {
          try {
            await login('test@example.com', 'password123');
          } catch (err) {
            // Catch error to prevent test from failing
            console.error('Login error caught in component:', err);
          }
        }}>
          Login
        </button>
        
        <button data-testid="register-button" onClick={async () => {
          try {
            await register('TestUser', 'test@example.com', 'password123');
          } catch (err) {
            // Catch error to prevent test from failing
            console.error('Register error caught in component:', err);
          }
        }}>
          Register
        </button>
        
        <button data-testid="logout-button" onClick={logout}>
          Logout
        </button>
        
        <button data-testid="clear-error-button" onClick={clearError}>
          Clear Error
        </button>
      </div>
    );
  };
  
  // Mock localStorage
  let mockLocalStorage = {};
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock localStorage
    mockLocalStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(key => mockLocalStorage[key] || null),
        setItem: jest.fn((key, value) => { mockLocalStorage[key] = value; }),
        removeItem: jest.fn(key => { delete mockLocalStorage[key]; }),
      },
      writable: true
    });
    
    // Mock console methods to reduce noise
    console.error = jest.fn();
    console.log = jest.fn();
  });
  
  afterEach(() => {
    // Restore console methods
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });
  
  test('initializes with unauthenticated state when no token exists', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially we should see loading
    expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading');
    
    // After initialization completes, we should not be authenticated
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user-data')).toHaveTextContent('No User');
    });
    
    // Verify localStorage was checked
    expect(window.localStorage.getItem).toHaveBeenCalledWith('token');
    
    // Since no token, the API getCurrentUser should not be called
    expect(apiService.auth.getCurrentUser).not.toHaveBeenCalled();
  });
  
  test('initializes with authenticated state when token exists', async () => {
    // Setup mock token in localStorage
    mockLocalStorage.token = 'valid-token';
    
    // Setup mock user data
    const mockUser = { id: '1', username: 'testuser', name: 'Test User' };
    apiService.auth.getCurrentUser.mockResolvedValueOnce(mockUser);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initialization to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-data')).toHaveTextContent(JSON.stringify(mockUser));
    });
    
    // Verify token was set in API service
    expect(apiService.setToken).toHaveBeenCalledWith('valid-token');
    expect(apiService.auth.getCurrentUser).toHaveBeenCalled();
  });
  
  test('handles API error during initialization with saved user data', async () => {
    // Setup mock token and saved user in localStorage
    mockLocalStorage.token = 'valid-token';
    mockLocalStorage.user = JSON.stringify({ id: '1', username: 'saveduser', name: 'Saved User' });
    
    // Make getCurrentUser throw an error
    apiService.auth.getCurrentUser.mockRejectedValueOnce(new Error('API Error'));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Even with API error, we should be authenticated from saved user data
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      
      // Check that the user data contains the saved user info
      const userData = screen.getByTestId('user-data').textContent;
      expect(userData).toContain('saveduser');
    });
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalled();
  });
  
  test('handles 404 error during initialization', async () => {
    // Setup mock token in localStorage
    mockLocalStorage.token = 'valid-token';
    
    // Mock a 404 response (endpoint not found)
    apiService.auth.getCurrentUser.mockRejectedValueOnce({
      response: { status: 404 }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // With a 404, we should still be authenticated but with minimal user
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // Token should not be removed
    expect(window.localStorage.removeItem).not.toHaveBeenCalledWith('token');
  });
  
  test('handles successful login', async () => {
    // Mock successful login response
    const mockLoginResponse = {
      token: 'new-token',
      user: { id: '1', username: 'loginuser', name: 'Login User' }
    };
    apiService.auth.login.mockResolvedValueOnce(mockLoginResponse);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Click login button
    fireEvent.click(screen.getByTestId('login-button'));
    
    // After login completes, we should be authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      
      // Check that the user data contains the login user info
      const userData = screen.getByTestId('user-data').textContent;
      expect(userData).toContain('loginuser');
    });
    
    // Verify API was called correctly
    expect(apiService.auth.login).toHaveBeenCalledWith('test@example.com', 'password123');
    
    // Verify token was saved and set
    expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockLoginResponse.user));
    expect(apiService.setToken).toHaveBeenCalledWith('new-token');
  });
  
  test('handles login error', async () => {
    // Mock login error
    const errorResponse = {
      response: { data: { message: 'Invalid credentials' } }
    };
    apiService.auth.login.mockRejectedValueOnce(errorResponse);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Suppress console.error for expected error
    console.error = jest.fn();
    
    // Click login button and wait for the error to be caught
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Wait for error state to be set (may take some time)
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).not.toHaveTextContent('No Error');
    }, { timeout: 3000 });
    
    // Should remain unauthenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    
    // Test error clearing
    fireEvent.click(screen.getByTestId('clear-error-button'));
    expect(screen.getByTestId('error-message')).toHaveTextContent('No Error');
  });
  
  test('handles successful registration', async () => {
    // Mock successful registration response
    const mockRegisterResponse = {
      token: 'register-token',
      user: { id: '2', username: 'newuser', name: 'New User' }
    };
    apiService.auth.register.mockResolvedValueOnce(mockRegisterResponse);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Click register button
    fireEvent.click(screen.getByTestId('register-button'));
    
    // After registration completes, we should be authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      
      // Check that the user data contains the new user info
      const userData = screen.getByTestId('user-data').textContent;
      expect(userData).toContain('newuser');
    });
    
    // Verify API was called correctly (may need to adjust based on the actual implementation)
    expect(apiService.auth.register).toHaveBeenCalled();
    
    // Verify token was saved and set
    expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'register-token');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockRegisterResponse.user));
    expect(apiService.setToken).toHaveBeenCalledWith('register-token');
  });
  
  test('handles registration error', async () => {
    // Mock registration error
    const errorResponse = {
      response: { data: { message: 'Email already in use' } }
    };
    apiService.auth.register.mockRejectedValueOnce(errorResponse);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Suppress console.error for expected error
    console.error = jest.fn();
    
    // Click register button and wait for the error to be caught
    fireEvent.click(screen.getByTestId('register-button'));
    
    // Wait for error state to be set (may take some time)
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).not.toHaveTextContent('No Error');
    }, { timeout: 3000 });
    
    // Should remain unauthenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
  });
  
  test('handles logout', async () => {
    // Setup as authenticated first
    mockLocalStorage.token = 'valid-token';
    mockLocalStorage.user = JSON.stringify({ id: '1', username: 'testuser', name: 'Test User' });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait until authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // Click logout button
    fireEvent.click(screen.getByTestId('logout-button'));
    
    // Should immediately be logged out
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user-data')).toHaveTextContent('No User');
    
    // Verify localStorage and token were cleared
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('user');
    expect(apiService.setToken).toHaveBeenCalledWith(null);
  });
  
  test('handles invalid JSON in saved user data', async () => {
    // Setup corrupt localStorage data
    mockLocalStorage.token = 'valid-token';
    mockLocalStorage.user = '{invalid-json}';
    
    console.error = jest.fn(); // Suppress expected errors
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Should attempt to parse user and log error, then try API call
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error parsing saved user'),
        expect.anything()
      );
    });
    
    // Confirm API was still called to fetch user
    expect(apiService.auth.getCurrentUser).toHaveBeenCalled();
  });
  
  test('handles API error without saved user data', async () => {
    // Setup token but no saved user
    mockLocalStorage.token = 'valid-token';
    mockLocalStorage.user = null;
    
    // Mock an error response that's not a 404
    const errorResponse = {
      response: { status: 500, data: { message: 'Server error' } }
    };
    apiService.auth.getCurrentUser.mockRejectedValueOnce(errorResponse);
    console.error = jest.fn(); // Suppress expected errors
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Should be unauthenticated since there's no saved user data and the API call failed
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    
    // Verify token was removed
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(apiService.setToken).toHaveBeenCalledWith(null);
  });
  
  test('handles general error in auth check without saved user', async () => {
    // Setup token but no saved user
    mockLocalStorage.token = 'valid-token';
    mockLocalStorage.user = null;
    
    // Mock a general error (not API response related)
    apiService.auth.getCurrentUser.mockImplementationOnce(() => {
      throw new Error('Network error');
    });
    console.error = jest.fn(); // Suppress expected errors
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Should be unauthenticated after error
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    
    // Verify error was logged and token was removed
    expect(console.error).toHaveBeenCalledWith(
      'Error validating token:',
      expect.anything()
    );
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(apiService.setToken).toHaveBeenCalledWith(null);
  });
  
  test('maintains authentication with saved user data despite API error', async () => {
    // Setup token and valid saved user
    mockLocalStorage.token = 'valid-token';
    mockLocalStorage.user = JSON.stringify({ id: '1', username: 'saveduser', name: 'Saved User' });
    
    // Mock a general error (not API response related)
    apiService.auth.getCurrentUser.mockImplementationOnce(() => {
      throw new Error('Network error');
    });
    console.error = jest.fn(); // Suppress expected errors
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Should remain authenticated due to saved user data
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-data')).toHaveTextContent('saveduser');
    
    // Verify error was logged but token was not removed
    expect(console.error).toHaveBeenCalledWith(
      'Error validating token:',
      expect.anything()
    );
    expect(window.localStorage.removeItem).not.toHaveBeenCalledWith('token');
  });
  
  test('handles 404 error without saved user data', async () => {
    // Setup token but no saved user
    mockLocalStorage.token = 'valid-token';
    mockLocalStorage.user = null;
    
    // Mock a 404 response
    const errorResponse = {
      response: { status: 404, data: { message: 'Endpoint not found' } }
    };
    apiService.auth.getCurrentUser.mockRejectedValueOnce(errorResponse);
    console.error = jest.fn(); // Suppress expected errors
    console.log = jest.fn(); // Capture log messages
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Should still be authenticated since we're handling 404 specially
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    
    // Verify 404 logic executed
    expect(console.log).toHaveBeenCalledWith(
      'Auth endpoint not found, but keeping token for other API endpoints'
    );
    expect(window.localStorage.removeItem).not.toHaveBeenCalledWith('token');
    
    // Should create a minimal user object
    const userData = screen.getByTestId('user-data').textContent;
    expect(userData).toContain('User');
  });
  
  test('clears error when clearError is called', async () => {
    // Mock login error to set an error
    const errorResponse = {
      response: { data: { message: 'Invalid credentials' } }
    };
    apiService.auth.login.mockRejectedValueOnce(errorResponse);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    console.error = jest.fn(); // Suppress expected errors
    
    // Click login button to trigger an error
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Wait for error to be set
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).not.toHaveTextContent('No Error');
    });
    
    // Clear the error
    fireEvent.click(screen.getByTestId('clear-error-button'));
    
    // Error should be cleared
    expect(screen.getByTestId('error-message')).toHaveTextContent('No Error');
  });
}); 