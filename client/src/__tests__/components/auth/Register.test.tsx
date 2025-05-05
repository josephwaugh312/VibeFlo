import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../../../components/auth/Register';
import { useAuth } from '../../../contexts/AuthContext';
import { authAPI } from '../../../services/api';

// Mock the useAuth hook
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the authAPI
jest.mock('../../../services/api', () => ({
  authAPI: {
    register: jest.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Register Component', () => {
  // Set up mocks before each test
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      login: jest.fn(),
    });
    
    mockNavigate.mockClear();
    (authAPI.register as jest.Mock).mockClear();
  });

  const renderRegisterComponent = () => {
    return render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
  };

  test('renders register form correctly', () => {
    renderRegisterComponent();
    
    // Check that the heading is displayed
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    
    // Check that the form elements are rendered
    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Username/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    
    // Check that the login link is present
    expect(screen.getByText('sign in to your existing account')).toBeInTheDocument();
    
    // Check social login options are present
    expect(screen.getByText('Or continue with')).toBeInTheDocument();
    expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(3); // At least 3 links (login + social logins)
  });

  test('shows validation error when fields are empty', async () => {
    renderRegisterComponent();
    
    // Submit the form without filling in fields
    const submitButton = screen.getByRole('button', { name: /register$/i });
    fireEvent.click(submitButton);
    
    // Check that validation error is displayed
    expect(await screen.findByText('Please fill in all fields')).toBeInTheDocument();
    
    // Verify API wasn't called
    expect(authAPI.register).not.toHaveBeenCalled();
  });

  test('shows error when passwords do not match', async () => {
    renderRegisterComponent();
    
    // Fill in form fields with mismatched passwords
    const nameInput = screen.getByPlaceholderText('Full Name');
    const usernameInput = screen.getByPlaceholderText(/Username/);
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /register$/i });
    fireEvent.click(submitButton);
    
    // Check that password mismatch error is displayed
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    
    // Verify API wasn't called
    expect(authAPI.register).not.toHaveBeenCalled();
  });

  test('validates username format', async () => {
    renderRegisterComponent();
    
    // Fill in form fields with invalid username
    const nameInput = screen.getByPlaceholderText('Full Name');
    const usernameInput = screen.getByPlaceholderText(/Username/);
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(usernameInput, { target: { value: 'te@$' } }); // Invalid username with special characters
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /register$/i });
    fireEvent.click(submitButton);
    
    // Check that username format error is displayed
    expect(await screen.findByText('Username must be 3-20 characters and can only contain letters, numbers, and underscores')).toBeInTheDocument();
    
    // Verify API wasn't called
    expect(authAPI.register).not.toHaveBeenCalled();
  });

  test('submits registration form with valid data', async () => {
    const mockUserData = {
      token: 'test-token',
      user: { id: '1', name: 'Test User', username: 'testuser', email: 'test@example.com' }
    };
    
    (authAPI.register as jest.Mock).mockResolvedValue(mockUserData);
    const mockLoginFn = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({ login: mockLoginFn });
    
    renderRegisterComponent();
    
    // Fill in form fields with valid data
    const nameInput = screen.getByPlaceholderText('Full Name');
    const usernameInput = screen.getByPlaceholderText(/Username/);
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /register$/i });
    fireEvent.click(submitButton);
    
    // Wait for API call and login to be called
    await waitFor(() => {
      expect(authAPI.register).toHaveBeenCalledWith('Test User', 'testuser', 'test@example.com', 'password123');
      expect(mockLoginFn).toHaveBeenCalledWith('test-token', mockUserData.user);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('shows loading state during form submission', async () => {
    // Delay API response to test loading state
    (authAPI.register as jest.Mock).mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            token: 'test-token',
            user: { id: '1', name: 'Test User', username: 'testuser', email: 'test@example.com' }
          });
        }, 100);
      });
    });
    
    renderRegisterComponent();
    
    // Fill in form fields with valid data
    const nameInput = screen.getByPlaceholderText('Full Name');
    const usernameInput = screen.getByPlaceholderText(/Username/);
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /register$/i });
    fireEvent.click(submitButton);
    
    // Check that loading state is shown
    expect(screen.getByText('Registering...')).toBeInTheDocument();
    
    // Wait for the loading state to disappear
    await waitFor(() => {
      expect(screen.queryByText('Registering...')).not.toBeInTheDocument();
    });
  });

  test('displays error message on registration failure', async () => {
    const errorMessage = 'Username already exists';
    
    // Mock API to throw an error
    (authAPI.register as jest.Mock).mockRejectedValue({
      response: { data: { message: errorMessage } }
    });
    
    renderRegisterComponent();
    
    // Fill in form fields with valid data
    const nameInput = screen.getByPlaceholderText('Full Name');
    const usernameInput = screen.getByPlaceholderText(/Username/);
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(usernameInput, { target: { value: 'existinguser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /register$/i });
    fireEvent.click(submitButton);
    
    // Check that error message is displayed
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    
    // Verify navigate wasn't called
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('uses fallback error message when API error has no message', async () => {
    // Mock API to throw an error without response data
    (authAPI.register as jest.Mock).mockRejectedValue({});
    
    renderRegisterComponent();
    
    // Fill in form fields with valid data
    const nameInput = screen.getByPlaceholderText('Full Name');
    const usernameInput = screen.getByPlaceholderText(/Username/);
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /register$/i });
    fireEvent.click(submitButton);
    
    // Check that fallback error message is displayed
    expect(await screen.findByText('Registration failed. Please try again.')).toBeInTheDocument();
  });
}); 