import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../../components/auth/Login';
import { useAuth } from '../../../contexts/AuthContext';
import { authAPI } from '../../../services/api';

// Mock the useAuth hook
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the authAPI
jest.mock('../../../services/api', () => ({
  authAPI: {
    login: jest.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Login Component', () => {
  // Set up mocks before each test
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      login: jest.fn(),
    });
    
    mockNavigate.mockClear();
    (authAPI.login as jest.Mock).mockClear();
  });

  const renderLoginComponent = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  test('renders login form correctly', () => {
    renderLoginComponent();
    
    // Check that the heading is displayed
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    
    // Check that the form elements are rendered
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    
    // Check that the register link is present
    expect(screen.getByText('create a new account')).toBeInTheDocument();
    
    // Check social login options are present
    expect(screen.getByText('Or continue with')).toBeInTheDocument();
    expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(3); // At least 3 links (register + social logins)
  });

  test('shows validation error when fields are empty', async () => {
    renderLoginComponent();
    
    // Submit the form without filling in fields
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    // Check that validation error is displayed
    expect(await screen.findByText('Please fill in all fields')).toBeInTheDocument();
    
    // Verify API wasn't called
    expect(authAPI.login).not.toHaveBeenCalled();
  });

  test('submits form with email and password', async () => {
    const mockUserData = {
      token: 'test-token',
      user: { id: '1', name: 'Test User', email: 'test@example.com' }
    };
    
    (authAPI.login as jest.Mock).mockResolvedValue(mockUserData);
    const mockLoginFn = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({ login: mockLoginFn });
    
    renderLoginComponent();
    
    // Fill in form fields
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    // Wait for API call and login to be called
    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockLoginFn).toHaveBeenCalledWith('test-token', mockUserData.user);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('shows loading state during form submission', async () => {
    // Delay API response to test loading state
    (authAPI.login as jest.Mock).mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            token: 'test-token',
            user: { id: '1', name: 'Test User', email: 'test@example.com' }
          });
        }, 100);
      });
    });
    
    renderLoginComponent();
    
    // Fill in form fields
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    // Check that loading state is shown
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    
    // Wait for the loading state to disappear
    await waitFor(() => {
      expect(screen.queryByText('Signing in...')).not.toBeInTheDocument();
    });
  });

  test('displays error message on login failure', async () => {
    const errorMessage = 'Invalid credentials';
    
    // Mock API to throw an error
    (authAPI.login as jest.Mock).mockRejectedValue({
      response: { data: { message: errorMessage } }
    });
    
    renderLoginComponent();
    
    // Fill in form fields
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    // Check that error message is displayed
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    
    // Verify navigate wasn't called
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('uses fallback error message when API error has no message', async () => {
    // Mock API to throw an error without response data
    (authAPI.login as jest.Mock).mockRejectedValue({});
    
    renderLoginComponent();
    
    // Fill in and submit the form
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    // Check that fallback error message is displayed
    expect(await screen.findByText('Login failed. Please try again.')).toBeInTheDocument();
  });
}); 