import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from '../../pages/Login';
import { renderWithProviders } from '../utils/test-utils';

// Mock the react-router-dom module
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('../mocks/react-router-dom'),
}));

// Mock the AuthContext hooks
jest.mock('../../contexts/AuthContext', () => {
  const originalModule = jest.requireActual('../../contexts/AuthContext');
  return {
    ...originalModule,
    useAuth: jest.fn(),
  };
});

// Import the mocked hook after mocking
import { useAuth } from '../../contexts/AuthContext';
import { mockNavigate } from '../mocks/react-router-dom';

describe('Login Page', () => {
  // Setup default mocked values and reset before each test
  const mockLogin = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Set default mock implementation for useAuth
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      isLoading: false,
      user: null
    });
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  it('renders the login form correctly', () => {
    renderWithProviders(<Login />, ['router', 'auth']);
    
    // Check for heading
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    
    // Check for email input
    const emailInput = screen.getByPlaceholderText('Email address');
    expect(emailInput).toBeInTheDocument();
    
    // Check for password input
    const passwordInput = screen.getByPlaceholderText('Password');
    expect(passwordInput).toBeInTheDocument();
    
    // Check for submit button
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeInTheDocument();
    
    // Check for registration link
    const registerLink = screen.getByText('create a new account');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.getAttribute('href')).toBe('/register');
    
    // Check for forgot password link
    const forgotPasswordLink = screen.getByText('Forgot your password?');
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink.getAttribute('href')).toBe('/forgot-password');
  });
  
  it('checks for required form fields', () => {
    renderWithProviders(<Login />, ['router', 'auth']);
    
    // Get the form inputs
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    // Check if the inputs have the required attribute
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    
    // Check if the inputs have email and password types
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
  
  it('allows user to input email and password', () => {
    renderWithProviders(<Login />, ['router', 'auth']);
    
    // Get the input elements
    const emailInput = screen.getByPlaceholderText('Email address') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
    
    // Enter values
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Check the values were set correctly
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });
  
  it('submits the form with correct values', async () => {
    // Mock successful login
    mockLogin.mockResolvedValueOnce(undefined);
    
    renderWithProviders(<Login />, ['router', 'auth']);
    
    // Get the input elements and fill them
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Check login function was called with correct values
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    
    // Wait for navigation to dashboard after successful login
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
  
  it('shows loading state during form submission', async () => {
    // Mock login function to create a delay
    const loginPromise = new Promise<void>(resolve => {
      setTimeout(() => resolve(), 100);
    });
    mockLogin.mockReturnValue(loginPromise);
    
    renderWithProviders(<Login />, ['router', 'auth']);
    
    // Fill in the form
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Check for loading text
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    // Resolve the promise and check loading state is cleared
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Signing in...')).not.toBeInTheDocument();
    });
  });
  
  it('displays an error message when login fails', async () => {
    // Mock login failure
    const error = new Error('Login failed');
    (error as any).response = { 
      data: { message: 'Invalid email or password' },
      status: 401
    };
    mockLogin.mockRejectedValueOnce(error);
    
    renderWithProviders(<Login />, ['router', 'auth']);
    
    // Fill in the form
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });
  
  it('handles account lockout correctly', async () => {
    // Mock too many login attempts response
    const error = new Error('Too many attempts');
    (error as any).response = {
      data: { message: 'Too many login attempts. Please try again in 15 minutes.' },
      status: 429
    };
    mockLogin.mockRejectedValueOnce(error);
    
    renderWithProviders(<Login />, ['router', 'auth']);
    
    // Fill in the form
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Check for lockout message
    await waitFor(() => {
      expect(screen.getByText('Too many login attempts. Please try again in 15 minutes.')).toBeInTheDocument();
    });
    
    // Check if form inputs and button are disabled during lockout
    await waitFor(() => {
      // We can't be certain about timeLeft text as it depends on timer
      expect(screen.getByText(/Time remaining:/)).toBeInTheDocument();
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });
}); 