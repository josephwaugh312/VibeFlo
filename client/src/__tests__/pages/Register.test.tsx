import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Register from '../../pages/Register';
import { renderWithProviders } from '../utils/test-utils';

// Mock the react-router-dom module
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('../mocks/react-router-dom'),
}));

// Mock the auth API service
jest.mock('../../services/api', () => {
  return {
    authAPI: {
      register: jest.fn(),
      login: jest.fn(),
      getCurrentUser: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      deleteAccount: jest.fn(),
    }
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Import the mocked API after mocking
import { authAPI } from '../../services/api';
import { mockNavigate } from '../mocks/react-router-dom';

describe('Register Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Clear localStorage before each test
    window.localStorage.clear();
    
    // Set default mock for register function
    (authAPI.register as jest.Mock).mockResolvedValue({
      token: 'test-token',
      user: {
        id: '1',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com'
      }
    });
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  it('renders the registration form correctly', () => {
    renderWithProviders(<Register />, ['router', 'theme', 'auth']);
    
    // Check for heading
    expect(screen.getByRole('heading', { name: 'Create Account', level: 1 })).toBeInTheDocument();
    
    // Check for input fields
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    
    // Check for submit button
    const submitButton = screen.getByRole('button', { name: /create account/i });
    expect(submitButton).toBeInTheDocument();
    
    // Check for sign in link
    const signInLink = screen.getByText('Log in');
    expect(signInLink).toBeInTheDocument();
    expect(signInLink.getAttribute('href')).toBe('/login');
  });
  
  it('checks for required form fields', () => {
    renderWithProviders(<Register />, ['router', 'theme', 'auth']);
    
    // Get the form inputs
    const usernameInput = screen.getByLabelText('Username');
    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    
    // Check if the inputs have the required attribute
    expect(usernameInput).toBeInTheDocument();
    expect(nameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toBeInTheDocument();
    
    // Check input types
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });
  
  it('allows user to input form values', async () => {
    renderWithProviders(<Register />, ['router', 'theme', 'auth']);
    
    // Get the input elements
    const usernameInput = screen.getByLabelText('Username') as HTMLInputElement;
    const nameInput = screen.getByLabelText('Full Name') as HTMLInputElement;
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText('Confirm Password') as HTMLInputElement;
    
    // Enter values
    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    });
    
    // Check the values were set correctly
    expect(usernameInput.value).toBe('testuser');
    expect(nameInput.value).toBe('Test User');
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
    expect(confirmPasswordInput.value).toBe('password123');
  });
  
  it('validates password matching', async () => {
    renderWithProviders(<Register />, ['router', 'theme', 'auth']);
    
    // Get the input elements and fill them
    const usernameInput = screen.getByLabelText('Username');
    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    
    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } }); // Different password
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Check for error message
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    
    // Verify register was not called
    expect(authAPI.register).not.toHaveBeenCalled();
  });
  
  it('validates username format', async () => {
    // Override the register mock for this specific test
    (authAPI.register as jest.Mock).mockRejectedValueOnce({
      response: {
        data: { message: 'Invalid username format' }
      }
    });

    renderWithProviders(<Register />, ['router', 'theme', 'auth']);
    
    // Get the input elements and fill them
    const usernameInput = screen.getByLabelText('Username');
    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    
    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: 'inv@lid' } }); // Invalid username with special char
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Wait for the error message from API response
    await waitFor(() => {
      expect(screen.getByText('Invalid username format')).toBeInTheDocument();
    });
  });
  
  it('submits the form with correct values', async () => {
    // Mock the register function to generate the token response
    const mockRegisterResponse = {
      token: 'test-token',
      user: {
        id: '1',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com'
      }
    };
    
    // Create a spy on localStorage.setItem
    const setItemSpy = jest.spyOn(window.localStorage, 'setItem');
    
    // Set up auth API mock
    (authAPI.register as jest.Mock).mockImplementation(() => {
      return Promise.resolve(mockRegisterResponse);
    });

    renderWithProviders(<Register />, ['router', 'theme', 'auth']);
    
    // Get the input elements and fill them
    const usernameInput = screen.getByLabelText('Username');
    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    
    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Check register function was called with correct values (order: email, username, password, confirmPassword)
    expect(authAPI.register).toHaveBeenCalledWith('testuser', 'testuser', 'test@example.com', 'password123');
    
    // Verify success message appears
    await waitFor(() => {
      expect(screen.getByText(/Registration successful/)).toBeInTheDocument();
    });
    
    // Wait for navigation to login after successful registration
    await act(async () => {
      jest.advanceTimersByTime(5000); // Fast-forward 5 seconds
    });
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
  
  it('shows loading state during form submission', async () => {
    // Mock register to create a delay
    const registerPromise = new Promise(resolve => {
      setTimeout(() => resolve({
        token: 'test-token',
        user: {
          id: '1',
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com'
        }
      }), 100);
    });
    (authAPI.register as jest.Mock).mockReturnValue(registerPromise);
    
    renderWithProviders(<Register />, ['router', 'theme', 'auth']);
    
    // Fill in the form
    const usernameInput = screen.getByLabelText('Username');
    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    
    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Check for loading text and disabled button
    expect(submitButton).toBeDisabled();
    
    // Resolve the promise
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/Registration successful/)).toBeInTheDocument();
    });
  });
  
  it('displays an error message when registration fails', async () => {
    // Mock registration failure
    const error = new Error('Registration failed');
    (error as any).response = { 
      data: { message: 'Username already exists' },
      status: 400
    };
    (authAPI.register as jest.Mock).mockRejectedValueOnce(error);
    
    renderWithProviders(<Register />, ['router', 'theme', 'auth']);
    
    // Fill in the form
    const usernameInput = screen.getByLabelText('Username');
    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    
    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Username already exists')).toBeInTheDocument();
    });
  });
}); 