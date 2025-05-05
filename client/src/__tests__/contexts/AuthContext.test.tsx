import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

// Set a longer timeout for Auth Context tests
jest.setTimeout(30000);

// Define the mock response object
const mockUser = { 
  id: '1',
  name: 'Test User', 
  username: 'testuser', 
  email: 'test@example.com' 
};

const mockLoginResponse = {
  token: 'test-auth-token',
  user: mockUser
};

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

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Import toast to check calls
import toast from 'react-hot-toast';

// Create a comprehensive test component that exposes all auth functions
const TestComponent = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    logout,
    register,
    updateProfile,
    changePassword,
    deleteAccount
  } = useAuth();

  return (
    <div>
      <div data-testid="loading-state">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="auth-state">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user-name">{user ? user.name : 'No User'}</div>
      <div data-testid="user-details">{user ? JSON.stringify(user) : 'No User Details'}</div>
      
      <button 
        data-testid="login-button" 
        onClick={() => login('test@example.com', 'password123')}
      >
        Login
      </button>

      <button 
        data-testid="login-remember-me-button" 
        onClick={() => login('test@example.com', 'password123', true)}
      >
        Login with Remember Me
      </button>

      <button 
        data-testid="login-no-remember-me-button" 
        onClick={() => login('test@example.com', 'password123', false)}
      >
        Login without Remember Me
      </button>
      
      <button 
        data-testid="logout-button" 
        onClick={logout}
      >
        Logout
      </button>

      <button
        data-testid="register-button"
        onClick={() => register('New User', 'newuser', 'new@example.com', 'password123')}
      >
        Register
      </button>

      <button
        data-testid="update-profile-button"
        onClick={() => updateProfile({ name: 'Updated User', bio: 'New bio' })}
      >
        Update Profile
      </button>

      <button
        data-testid="change-password-button"
        onClick={() => changePassword('oldPassword', 'newPassword')}
      >
        Change Password
      </button>

      <button
        data-testid="delete-account-button"
        onClick={() => deleteAccount('password123')}
      >
        Delete Account
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  // Mock localStorage
  const mockLocalStorage = (() => {
    let store = {};
    return {
      getItem: jest.fn(key => store[key] || null),
      setItem: jest.fn((key, value) => { store[key] = value; }),
      removeItem: jest.fn(key => { delete store[key]; }),
      clear: jest.fn(() => { store = {}; }),
      store
    };
  })();

  Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

  // Save original console methods
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    
    // Reset the mock implementation for each test
    (apiService.auth.login as jest.Mock).mockResolvedValue(mockLoginResponse);
    (apiService.auth.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    // Mock console methods
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterAll(() => {
    // Restore original console methods
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  // Test 1: Initial state
  test('provides initial unauthenticated state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for the initial loading to complete
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'), { timeout: 15000 });
    
    // Initial state should be unauthenticated
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
  });

  // Test 2: Login flow
  test('updates auth state on login', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for the initial loading to complete
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'), { timeout: 15000 });
    
    // Click login button
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Wait for the login process to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });
    
    // Verify API calls
    expect(apiService.auth.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(apiService.setToken).toHaveBeenCalledWith('test-auth-token');
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Welcome back'));
  });

  // Test 3: Logout flow
  test('clears auth state on logout', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for the initial loading to complete
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'), { timeout: 15000 });
    
    // Click login first
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Wait for successful login
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated'));
    
    // Now logout
    fireEvent.click(screen.getByTestId('logout-button'));
    
    // Verify logged out state
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
    
    // Verify API call
    expect(apiService.setToken).toHaveBeenCalledWith(null);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    expect(toast.success).toHaveBeenCalledWith('Logged out successfully');
  });

  // Test 4: Registration flow
  test('handles user registration', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for the initial loading to complete
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'), { timeout: 15000 });
    
    // Click register button
    fireEvent.click(screen.getByTestId('register-button'));
    
    // Should be loading during registration
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading'));
    
    // Wait for registration to complete
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'));
    
    // Verify API call
    expect(apiService.auth.register).toHaveBeenCalledWith('New User', 'newuser', 'new@example.com', 'password123');
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Registration successful'));
  });

  // Test 5: Profile update
  test('updates user profile', async () => {
    // Set up a successful profile update mock
    (apiService.auth.updateProfile as jest.Mock).mockResolvedValueOnce({
      id: '1', 
      name: 'Updated User',
      username: 'testuser',
      email: 'test@example.com',
      bio: 'New bio'
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // We need to be authenticated first to update a profile
    // Wait for the initial loading to complete
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'), { timeout: 15000 });
    
    // Click login first
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Wait for authentication to complete
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated'));
    
    // Make sure login happened and user object is available
    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });
    
    // Now try to update the profile
    // We need to wrap it in act for state updates
    await act(async () => {
      // Click update profile button
      fireEvent.click(screen.getByTestId('update-profile-button'));
      
      // Wait a moment for state to settle
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Verify API call
    await waitFor(() => {
      expect(apiService.auth.updateProfile).toHaveBeenCalledWith({ name: 'Updated User', bio: 'New bio' });
    });
    
    // Verify that the user object was updated
    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Updated User');
    });
    
    // Check that success notification was shown
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Profile updated'));
  });

  // Test 6: Password Change
  test('changes user password', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for the initial loading to complete
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'), { timeout: 15000 });
    
    // Login first
    fireEvent.click(screen.getByTestId('login-button'));
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated'));
    
    // Click change password button
    fireEvent.click(screen.getByTestId('change-password-button'));
    
    // Should be loading during password change
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading'));
    
    // Wait for password change to complete
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'));
    
    // Verify API call
    expect(apiService.auth.changePassword).toHaveBeenCalledWith('oldPassword', 'newPassword');
    expect(toast.success).toHaveBeenCalledWith('Password changed successfully');
  });

  // Test 7: Account Deletion
  test('deletes user account', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for the initial loading to complete
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'), { timeout: 15000 });
    
    // Login first
    fireEvent.click(screen.getByTestId('login-button'));
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated'));
    
    // Click delete account button
    fireEvent.click(screen.getByTestId('delete-account-button'));
    
    // Should be loading during account deletion
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading'));
    
    // Wait for account deletion to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
    });
    
    // Verify API call and cleanup
    expect(apiService.auth.deleteAccount).toHaveBeenCalledWith('password123');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    expect(apiService.setToken).toHaveBeenCalledWith(null);
    expect(toast.success).toHaveBeenCalledWith('Account deleted successfully');
  });

  // Test 8: Login with rememberMe=false
  test('handles login without remember me option', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for the initial loading to complete
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'), { timeout: 15000 });
    
    // Click login without remember me button
    fireEvent.click(screen.getByTestId('login-no-remember-me-button'));
    
    // Wait for the login process to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
    });
    
    // Verify API calls - login receives rememberMe param but it doesn't change how we call the api
    // Just check token was set with API service
    expect(apiService.setToken).toHaveBeenCalledWith('test-auth-token');
  });

  // Test 9: Login Error Handling
  test('displays proper error message for login errors', async () => {
    // Create a proper mock implementation that will return a rejected promise
    const mockLogin = jest.fn().mockImplementation(() => {
      return Promise.reject({
        response: {
          status: 400,
          data: { message: 'Invalid credentials' }
        }
      });
    });
    
    // Replace the mock with our custom implementation
    (apiService.auth.login as jest.Mock).mockImplementation(mockLogin);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'), { timeout: 15000 });
    
    // Click login button - using act to handle async updates
    await act(async () => {
      fireEvent.click(screen.getByTestId('login-button'));
    });
    
    // Wait for error handling to complete
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  // Test 10: Auto Login from localStorage
  test('automatically logs in with stored token', async () => {
    // Set up a token in localStorage
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'stored-token';
      return null;
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for auto-login to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    }, { timeout: 15000 });
    
    // Verify API calls
    expect(apiService.setToken).toHaveBeenCalledWith('stored-token');
    expect(apiService.auth.getCurrentUser).toHaveBeenCalled();
  });

  // Test 11: Handle invalid token during auto-login
  test('handles invalid stored token', async () => {
    // Set up a token in localStorage
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'invalid-token';
      return null;
    });
    
    // Mock getCurrentUser to fail with 401
    (apiService.auth.getCurrentUser as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 401,
        data: { message: 'Invalid token' }
      }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
    }, { timeout: 15000 });
    
    // Verify token cleanup
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    expect(apiService.setToken).toHaveBeenCalledWith(null);
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Session expired'));
  });

  // Test 12: Use cached user data when server is unavailable
  test('uses cached user data when server is unavailable', async () => {
    // Set up a token and cached user in localStorage
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'valid-token';
      if (key === 'cachedUser') return JSON.stringify({
        id: '1',
        name: 'Cached User',
        username: 'cacheduser',
        email: 'cached@example.com'
      });
      return null;
    });
    
    // Mock getCurrentUser to fail with network error
    (apiService.auth.getCurrentUser as jest.Mock).mockRejectedValueOnce({
      // Not a 401 error, but a network error
      message: 'Network Error'
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Cached User');
    }, { timeout: 15000 });
    
    // Token should not be removed as this is just a network error
    expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('token');
  });

  // Test for specific error messages in registration
  test('handles specific registration error messages', async () => {
    // Create a proper mock implementation that will return a rejected promise
    const mockRegister = jest.fn().mockImplementation(() => {
      return Promise.reject({
        response: { 
          data: { message: 'Username already taken' } 
        }
      });
    });
    
    // Replace the mock with our custom implementation
    (apiService.auth.register as jest.Mock).mockImplementation(mockRegister);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'), { timeout: 15000 });
    
    // Click register button - using act to handle async updates
    await act(async () => {
      fireEvent.click(screen.getByTestId('register-button'));
    });
    
    // Wait for error handling to complete
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Username already taken');
    });
  });

  // Test edge cases for token validation
  test('handles different error types during token validation', async () => {
    // Set up localStorage with a token
    mockLocalStorage.setItem('token', 'invalid-token');
    mockLocalStorage.setItem('cachedUser', JSON.stringify({ 
      id: '2', 
      name: 'Cached User', 
      username: 'cacheduser',
      email: 'cached@example.com'
    }));

    // First try with an authorization error without the specific message
    (apiService.auth.getCurrentUser as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          message: 'Unauthorized' // Not the specific "Invalid token" message
        }
      }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Should NOT log out since it's not the specific invalid token message
    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Cached User');
    }, { timeout: 15000 });
  });

  // Test corrupted cached user data handling
  test('handles corrupted cached user data', async () => {
    // Set up localStorage with a token and corrupted user data
    mockLocalStorage.setItem('token', 'some-token');
    mockLocalStorage.setItem('cachedUser', '{corrupt-json');

    // Mock API error to trigger cached user fallback
    (apiService.auth.getCurrentUser as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Should not be authenticated since cached data parsing failed
    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
    }, { timeout: 15000 });
  });

  // Test updateProfile error handling
  test('handles profile update errors properly', async () => {
    // Create a proper mock implementation that will return a rejected promise
    const mockUpdateProfile = jest.fn().mockImplementation(() => {
      return Promise.reject({
        response: {
          data: { message: 'Username is already taken' }
        }
      });
    });
    
    // Replace the mock with our custom implementation
    (apiService.auth.updateProfile as jest.Mock).mockImplementation(mockUpdateProfile);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'), { timeout: 15000 });

    // Click update profile button - using act to handle async updates
    await act(async () => {
      fireEvent.click(screen.getByTestId('update-profile-button'));
    });
    
    // Wait for error handling to complete
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Username is already taken');
    });
  });

  // Test for change password errors
  test('handles change password errors properly', async () => {
    // Create a proper mock implementation that will return a rejected promise
    const mockChangePassword = jest.fn().mockImplementation(() => {
      return Promise.reject({
        response: {
          data: { message: 'Current password is incorrect' }
        }
      });
    });
    
    // Replace the mock with our custom implementation
    (apiService.auth.changePassword as jest.Mock).mockImplementation(mockChangePassword);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'), { timeout: 15000 });

    // Click change password button - using act to handle async updates
    await act(async () => {
      fireEvent.click(screen.getByTestId('change-password-button'));
    });
    
    // Wait for error handling to complete
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Current password is incorrect');
    });
  });

  // Test for delete account errors
  test('handles account deletion errors properly', async () => {
    // Create a proper mock implementation that will return a rejected promise
    const mockDeleteAccount = jest.fn().mockImplementation(() => {
      return Promise.reject({
        response: {
          data: { message: 'Password is incorrect' }
        }
      });
    });
    
    // Replace the mock with our custom implementation
    (apiService.auth.deleteAccount as jest.Mock).mockImplementation(mockDeleteAccount);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'), { timeout: 15000 });

    // Click delete account button - using act to handle async updates
    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-account-button'));
    });
    
    // Wait for error handling to complete
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Password is incorrect');
    });
  });

  // Test when token exists but cached user data doesn't
  test('handles missing cached user data when server unavailable', async () => {
    // Set up localStorage with token but no cached user
    mockLocalStorage.setItem('token', 'existing-token');
    // Don't set cachedUser

    // Mock server error
    (apiService.auth.getCurrentUser as jest.Mock).mockRejectedValueOnce(new Error('Server unavailable'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Should not be authenticated since there's no cached user data
    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
    }, { timeout: 15000 });
  });
}); 