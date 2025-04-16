import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

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

// Mock the API service - be sure to include token in the response
jest.mock('../../services/api', () => {
  // Create mock functions
  const loginMock = jest.fn().mockResolvedValue({
    token: 'test-auth-token',
    user: { id: '1', name: 'Test User', username: 'testuser', email: 'test@example.com' }
  });
  
  const getCurrentUserMock = jest.fn().mockResolvedValue(
    { id: '1', name: 'Test User', username: 'testuser', email: 'test@example.com' }
  );
  
  const registerMock = jest.fn().mockResolvedValue({ 
    message: 'Registration successful'
  });

  const updateProfileMock = jest.fn().mockResolvedValue({
    id: '1', 
    name: 'Updated User',
    username: 'testuser',
    email: 'test@example.com',
    bio: 'New bio'
  });

  const changePasswordMock = jest.fn().mockResolvedValue({
    message: 'Password changed successfully'
  });

  const deleteAccountMock = jest.fn().mockResolvedValue({
    message: 'Account deleted successfully'
  });
  
  const setTokenMock = jest.fn();
  
  return {
    authAPI: {
      login: loginMock,
      register: registerMock,
      getCurrentUser: getCurrentUserMock,
      updateProfile: updateProfileMock,
      changePassword: changePasswordMock,
      deleteAccount: deleteAccountMock,
    },
    default: {
      setToken: setTokenMock
    },
    // This is important! The context accesses this directly
    setToken: setTokenMock
  };
});

// Import the mocked module
import apiService, { authAPI } from '../../services/api';

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

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    
    // Reset the mock implementation for each test
    (authAPI.login as jest.Mock).mockResolvedValue(mockLoginResponse);
    (authAPI.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
  });

  // Test 1: Initial state
  test('provides initial unauthenticated state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for the initial loading to complete
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'));
    
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
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'));
    
    // Click login button
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Wait for the login process to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });
    
    // Verify API calls
    expect(authAPI.login).toHaveBeenCalledWith('test@example.com', 'password123');
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
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'));
    
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
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'));
    
    // Click register button
    fireEvent.click(screen.getByTestId('register-button'));
    
    // Should be loading during registration
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading'));
    
    // Wait for registration to complete
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'));
    
    // Verify API call
    expect(authAPI.register).toHaveBeenCalledWith('New User', 'newuser', 'new@example.com', 'password123');
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Registration successful'));
  });

  // Test 5: Profile update
  test('updates user profile', async () => {
    // Set up a successful profile update mock
    (authAPI.updateProfile as jest.Mock).mockResolvedValueOnce({
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
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'));
    
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
      expect(authAPI.updateProfile).toHaveBeenCalledWith({ name: 'Updated User', bio: 'New bio' });
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
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'));
    
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
    expect(authAPI.changePassword).toHaveBeenCalledWith('oldPassword', 'newPassword');
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
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'));
    
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
    expect(authAPI.deleteAccount).toHaveBeenCalledWith('password123');
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
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'));
    
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
  test('handles login failure', async () => {
    // Mock login to fail
    (authAPI.login as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for the initial loading to complete
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading'));
    
    // Click login button
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Should be loading during login attempt
    await waitFor(() => expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading'));
    
    // Wait for the login process to fail
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
    });
    
    // Verify error handling
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Login failed'));
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
    });
    
    // Verify API calls
    expect(apiService.setToken).toHaveBeenCalledWith('stored-token');
    expect(authAPI.getCurrentUser).toHaveBeenCalled();
  });

  // Test 11: Handle invalid token during auto-login
  test('handles invalid stored token', async () => {
    // Set up a token in localStorage
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'invalid-token';
      return null;
    });
    
    // Mock getCurrentUser to fail with 401
    (authAPI.getCurrentUser as jest.Mock).mockRejectedValueOnce({
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
    });
    
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
    (authAPI.getCurrentUser as jest.Mock).mockRejectedValueOnce({
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
    });
    
    // Token should not be removed as this is just a network error
    expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('token');
  });
}); 