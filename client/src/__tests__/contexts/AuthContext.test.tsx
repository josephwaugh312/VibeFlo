import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Set a shorter timeout for these simple tests
jest.setTimeout(10000);

// Mocks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => mockAxios),
    defaults: {
      headers: {
        common: {}
      }
    },
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  };
  return mockAxios;
});

// Mock localStorage
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: jest.fn((key: string) => mockStorage[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: jest.fn(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  })
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Test component to expose auth context 
const TestComponent = () => {
  const {
    isAuthenticated,
    isLoading,
    user
  } = useAuth();

  return (
    <div>
      <div data-testid="auth-state">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="loading-state">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user-name">{user?.name || 'No User'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });

  // Test 1: Initial state only
  test('provides initial unauthenticated state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // We just check that the component renders with the expected initial state
    expect(screen.getByTestId('auth-state').textContent).toBe('Not Authenticated');
    expect(screen.getByTestId('user-name').textContent).toBe('No User');
  });
}); 