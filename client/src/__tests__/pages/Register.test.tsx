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

// Import the mocked API after mocking
import { authAPI } from '../../services/api';
import { mockNavigate } from '../mocks/react-router-dom';

describe('Register Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Clear localStorage before each test but don't redefine it
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
    renderWithProviders(<Register />, ['router']);
    
    // Check for heading
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    
    // Check for input fields
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
    
    // Check for submit button
    const submitButton = screen.getByRole('button', { name: /create account/i });
    expect(submitButton).toBeInTheDocument();
    
    // Check for sign in link
    const signInLink = screen.getByText('sign in to existing account');
    expect(signInLink).toBeInTheDocument();
    expect(signInLink.getAttribute('href')).toBe('/login');
  });
  
  it('checks for required form fields', () => {
    renderWithProviders(<Register />, ['router']);
    
    // Get the form inputs
    const usernameInput = screen.getByPlaceholderText('Username');
    const nameInput = screen.getByPlaceholderText('Full Name');
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    
    // Check if the inputs have the required attribute
    expect(usernameInput).toBeRequired();
    expect(nameInput).toBeRequired();
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    expect(confirmPasswordInput).toBeRequired();
    
    // Check input types
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });
  
  it('allows user to input form values', async () => {
    renderWithProviders(<Register />, ['router']);
    
    // Get the input elements
    const usernameInput = screen.getByPlaceholderText('Username') as HTMLInputElement;
    const nameInput = screen.getByPlaceholderText('Full Name') as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText('Email address') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password') as HTMLInputElement;
    
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
    renderWithProviders(<Register />, ['router']);
    
    // Get the input elements and fill them
    const usernameInput = screen.getByPlaceholderText('Username');
    const nameInput = screen.getByPlaceholderText('Full Name');
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    
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
    renderWithProviders(<Register />, ['router']);
    
    // Get the input elements and fill them
    const usernameInput = screen.getByPlaceholderText('Username');
    const nameInput = screen.getByPlaceholderText('Full Name');
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    
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
    
    // Check for error message
    expect(screen.getByText('Username must be 3-20 characters and can only contain letters, numbers, and underscores')).toBeInTheDocument();
    
    // Verify register was not called
    expect(authAPI.register).not.toHaveBeenCalled();
  });
  
  it('submits the form with correct values', async () => {
    // Mock localStorage.getItem to return the expected values
    (window.localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'token') return 'test-token';
      if (key === 'user') return JSON.stringify({
        id: '1',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com'
      });
      return null;
    });

    renderWithProviders(<Register />, ['router']);
    
    // Get the input elements and fill them
    const usernameInput = screen.getByPlaceholderText('Username');
    const nameInput = screen.getByPlaceholderText('Full Name');
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    
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
    
    // Check register function was called with correct values
    expect(authAPI.register).toHaveBeenCalledWith('Test User', 'testuser', 'test@example.com', 'password123');
    
    // Verify localStorage setItem was called with the right parameters
    expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({
      id: '1',
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com'
    }));
    
    // Wait for navigation to dashboard after successful registration
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
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
    
    renderWithProviders(<Register />, ['router']);
    
    // Fill in the form
    const usernameInput = screen.getByPlaceholderText('Username');
    const nameInput = screen.getByPlaceholderText('Full Name');
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    
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
    
    // Check for loading text
    expect(screen.getByText('Creating Account...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    // Resolve the promise
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    
    // Wait for loading state to be cleared
    await waitFor(() => {
      expect(screen.queryByText('Creating Account...')).not.toBeInTheDocument();
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
    
    renderWithProviders(<Register />, ['router']);
    
    // Fill in the form
    const usernameInput = screen.getByPlaceholderText('Username');
    const nameInput = screen.getByPlaceholderText('Full Name');
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    
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