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

// Mock the ThemeContext hook
jest.mock('../../context/ThemeContext', () => {
  const originalModule = jest.requireActual('../../context/ThemeContext');
  return {
    ...originalModule,
    useTheme: jest.fn(),
    ThemeProvider: ({ children }) => <>{children}</>,
  };
});

// Import the mocked hook after mocking
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
    
    // Mock ThemeContext to avoid errors
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: {
        id: 'default',
        name: 'Default Theme',
        background_color: '#ffffff',
        text_color: '#000000',
        primary_color: '#3498db',
        secondary_color: '#2ecc71',
        accent_color: '#e74c3c',
        is_dark: false,
      },
    });
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  it('renders the login form correctly', () => {
    renderWithProviders(<Login />, ['router', 'auth']);
    
    // Check for heading
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    
    // Check for email/username input
    const loginInput = screen.getByLabelText(/Email or Username/i);
    expect(loginInput).toBeInTheDocument();
    
    // Check for password input
    const passwordInput = screen.getByLabelText(/Password/i);
    expect(passwordInput).toBeInTheDocument();
    
    // Check for submit button
    const submitButton = screen.getByRole('button', { name: /log in/i });
    expect(submitButton).toBeInTheDocument();
  });
  
  it('checks for required form fields', () => {
    renderWithProviders(<Login />, ['router', 'auth']);
    
    // Get the form inputs
    const loginInput = screen.getByLabelText(/Email or Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    
    // Check if the inputs have the required attribute
    expect(loginInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });
  
  it('allows user to input email and password', () => {
    renderWithProviders(<Login />, ['router', 'auth']);
    
    // Get the input elements
    const loginInput = screen.getByLabelText(/Email or Username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Password/i) as HTMLInputElement;
    
    // Enter values
    fireEvent.change(loginInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Check the values were set correctly
    expect(loginInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });
  
  it('submits the form with correct values', async () => {
    // Mock successful login
    mockLogin.mockResolvedValueOnce({ success: true });
    
    renderWithProviders(<Login />, ['router', 'auth']);
    
    // Get the input elements and fill them
    const loginInput = screen.getByLabelText(/Email or Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    
    await act(async () => {
      fireEvent.change(loginInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /log in/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Check login function was called with correct values
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123', true);
    
    // Wait for navigation to dashboard after successful login
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
  
  it('shows loading state during form submission', async () => {
    // Mock login function to create a delay
    const loginPromise = new Promise<{success: boolean}>(resolve => {
      setTimeout(() => resolve({ success: true }), 100);
    });
    mockLogin.mockReturnValue(loginPromise);
    
    renderWithProviders(<Login />, ['router', 'auth']);
    
    // Fill in the form
    const loginInput = screen.getByLabelText(/Email or Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    
    await act(async () => {
      fireEvent.change(loginInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /log in/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Check that the button is disabled during loading
    expect(submitButton).toBeDisabled();
    
    // Resolve the promise and check loading state is cleared
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
  
  it('displays an error message when login fails', async () => {
    // Mock login failure
    mockLogin.mockResolvedValueOnce({ 
      success: false,
      message: 'Invalid email or password' 
    });
    
    renderWithProviders(<Login />, ['router', 'auth']);
    
    // Fill in the form
    const loginInput = screen.getByLabelText(/Email or Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    
    await act(async () => {
      fireEvent.change(loginInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /log in/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });
  
  it('handles account lockout correctly', async () => {
    // Mock login with needs verification
    mockLogin.mockResolvedValueOnce({
      success: false,
      needsVerification: true,
      email: 'test@example.com',
      message: 'Please verify your email before logging in.'
    });
    
    renderWithProviders(<Login />, ['router', 'auth']);
    
    // Fill in the form
    const loginInput = screen.getByLabelText(/Email or Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    
    await act(async () => {
      fireEvent.change(loginInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /log in/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Check for verification message
    await waitFor(() => {
      const verificationMessages = screen.getAllByText('Please verify your email before logging in.');
      expect(verificationMessages.length).toBeGreaterThan(0);
    });
  });
}); 