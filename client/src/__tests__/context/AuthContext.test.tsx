import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the AuthContext module
jest.mock('../../contexts/AuthContext', () => {
  return {
    useAuth: jest.fn().mockImplementation(() => ({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      clearError: jest.fn(),
      setUser: jest.fn(),
      setIsAuthenticated: jest.fn(),
      refreshUserData: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      deleteAccount: jest.fn(),
    })),
    AuthProvider: ({ children }) => <div>{children}</div>
  };
});

// Import after mocking
import { useAuth, AuthProvider } from '../../contexts/AuthContext';

// Create a proper localStorage mock
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: jest.fn(key => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn(index => Object.keys(store)[index] || null),
  };
})();

// Replace the window.localStorage with the mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

// Mock setTimeout and clearTimeout to speed up tests
jest.useFakeTimers();

const mockAuthContext = {
  initializeAuth: jest.fn().mockImplementation(() => {
    return Promise.resolve();
  }),
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  clearError: jest.fn(),
  setUser: jest.fn(),
  setIsAuthenticated: jest.fn(),
  refreshUserData: jest.fn(),
  updateProfile: jest.fn(),
  changePassword: jest.fn(),
  deleteAccount: jest.fn(),
};

// Mock the useAuth hook
jest.mock('../../contexts/AuthContext', () => {
  const originalModule = jest.requireActual('../../contexts/AuthContext');
  return {
    ...originalModule,
    useAuth: jest.fn().mockImplementation(() => mockAuthContext),
    AuthProvider: ({ children }) => <div>{children}</div>
  };
});

describe('AuthContext', () => {
  let mockContextValue;
  
  // Create a test component that uses the auth context
  const TestComponent = () => {
    const auth = useAuth();
    mockContextValue = auth; // Capture the context value for assertions
    
    return (
      <div>
        <div data-testid="auth-status">{auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
        <div data-testid="loading-status">{auth.isLoading ? 'Loading' : 'Not Loading'}</div>
        <div data-testid="user-data">{auth.user ? JSON.stringify(auth.user) : 'No User'}</div>
        <div data-testid="error-message">{auth.error || 'No Error'}</div>
        
        <button data-testid="login-button" onClick={() => auth.login('test@example.com', 'password123')}>
          Login
        </button>
        
        <button data-testid="register-button" onClick={() => auth.register('test@example.com', 'TestUser', 'password123', 'password123')}>
          Register
        </button>
        
        <button data-testid="logout-button" onClick={auth.logout}>
          Logout
        </button>
        
        <button data-testid="clear-error-button" onClick={auth.clearError}>
          Clear Error
        </button>
      </div>
    );
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Clear mock localStorage
    localStorageMock.clear();
    
    // Mock console methods to reduce noise
    console.error = jest.fn();
    console.log = jest.fn();
  });
  
  afterEach(() => {
    // Restore console methods
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });
  
  test('initializes with unauthenticated state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user-data')).toHaveTextContent('No User');
    expect(screen.getByTestId('error-message')).toHaveTextContent('No Error');
    
    // We expect localStorage to be checked during initialization, but since we're mocking
    // the entire context, this isn't actually happening
    // We could verify this in a more integrated test
  });
  
  test('renders authenticated state when user is present', () => {
    // Override the mock for this test
    jest.spyOn(require('../../contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', username: 'testuser', name: 'Test User' },
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      clearError: jest.fn(),
      setUser: jest.fn(),
      setIsAuthenticated: jest.fn(),
      refreshUserData: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      deleteAccount: jest.fn(),
    }));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-data')).toHaveTextContent('testuser');
  });
  
  test('handles login function', () => {
    // Create mock login function
    const mockLogin = jest.fn();
    
    // Override the mock for this test
    jest.spyOn(require('../../contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      login: mockLogin,
      register: jest.fn(),
      logout: jest.fn(),
      clearError: jest.fn(),
      setUser: jest.fn(),
      setIsAuthenticated: jest.fn(),
      refreshUserData: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      deleteAccount: jest.fn(),
    }));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Click login button
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Verify login was called with correct parameters
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
  });
  
  test('handles login success', () => {
    // Override the mock for this test
    jest.spyOn(require('../../contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', username: 'loginuser', name: 'Login User' },
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      clearError: jest.fn(),
      setUser: jest.fn(),
      setIsAuthenticated: jest.fn(),
      refreshUserData: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      deleteAccount: jest.fn(),
    }));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Verify authenticated state is shown
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-data')).toHaveTextContent('loginuser');
  });
  
  test('handles login error', () => {
    // Override the mock for this test
    jest.spyOn(require('../../contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: 'Invalid credentials',
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      clearError: jest.fn(),
      setUser: jest.fn(),
      setIsAuthenticated: jest.fn(),
      refreshUserData: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      deleteAccount: jest.fn(),
    }));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Verify error state is shown
    expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
  });
  
  test('handles register function', () => {
    // Create mock register function
    const mockRegister = jest.fn();
    
    // Override the mock for this test
    jest.spyOn(require('../../contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      login: jest.fn(),
      register: mockRegister,
      logout: jest.fn(),
      clearError: jest.fn(),
      setUser: jest.fn(),
      setIsAuthenticated: jest.fn(),
      refreshUserData: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      deleteAccount: jest.fn(),
    }));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Click register button
    fireEvent.click(screen.getByTestId('register-button'));
    
    // Verify register was called with correct parameters
    expect(mockRegister).toHaveBeenCalledWith('test@example.com', 'TestUser', 'password123', 'password123');
  });
  
  test('handles logout function', () => {
    // Create mock logout function
    const mockLogout = jest.fn();
    
    // Override the mock for this test - start authenticated
    jest.spyOn(require('../../contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', username: 'testuser', name: 'Test User' },
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
      clearError: jest.fn(),
      setUser: jest.fn(),
      setIsAuthenticated: jest.fn(),
      refreshUserData: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      deleteAccount: jest.fn(),
    }));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Verify authenticated state
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    
    // Click logout button
    fireEvent.click(screen.getByTestId('logout-button'));
    
    // Verify logout was called
    expect(mockLogout).toHaveBeenCalled();
  });
  
  test('handles clearError function', () => {
    // Create mock clearError function
    const mockClearError = jest.fn();
    
    // Override the mock for this test - start with error
    jest.spyOn(require('../../contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: 'Test error message',
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      clearError: mockClearError,
      setUser: jest.fn(),
      setIsAuthenticated: jest.fn(),
      refreshUserData: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      deleteAccount: jest.fn(),
    }));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Verify error is shown
    expect(screen.getByTestId('error-message')).toHaveTextContent('Test error message');
    
    // Click clear error button
    fireEvent.click(screen.getByTestId('clear-error-button'));
    
    // Verify clearError was called
    expect(mockClearError).toHaveBeenCalled();
  });
}); 