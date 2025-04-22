import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import ResetPassword from '../../pages/ResetPassword';
import apiService from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  auth: {
    verifyResetToken: jest.fn().mockResolvedValue({}),
    resetPassword: jest.fn().mockResolvedValue({}),
  },
}));

// Mock the router hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ token: 'valid-token' }),
}));

// Spy on console.error to prevent test output pollution
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Mock setTimeout
jest.useFakeTimers();

// For React Router DOM tests
describe('React Router DOM Mock Library', () => {
  test('exists as a module', () => {
    expect(jest.requireActual('react-router-dom')).toBeTruthy();
  });
});

describe('ResetPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  test('renders without crashing', () => {
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );
    
    // If we get here without errors, the test passes
    expect(true).toBeTruthy();
  });
  
  test('renders the reset form when token is valid', async () => {
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(apiService.auth.verifyResetToken).toHaveBeenCalled();
    });
    
    expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });
  
  test('shows error when token is invalid', async () => {
    // Override the API mock for this test
    (apiService.auth.verifyResetToken as jest.Mock).mockRejectedValueOnce(new Error('Invalid token'));
    
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Password Reset Failed')).toBeInTheDocument();
    });
  });

  test('updates password inputs when user types', async () => {
    // Reset API mock
    (apiService.auth.verifyResetToken as jest.Mock).mockResolvedValueOnce({});
    
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(apiService.auth.verifyResetToken).toHaveBeenCalled();
    });
    
    // Find password inputs by their type
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    expect(passwordInputs.length).toBe(2);
    
    // Type in password fields
    fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'password123' } });
    
    // Check if values were updated
    expect((passwordInputs[0] as HTMLInputElement).value).toBe('password123');
    expect((passwordInputs[1] as HTMLInputElement).value).toBe('password123');
  });

  test('shows error when passwords do not match', async () => {
    // Reset API mock
    (apiService.auth.verifyResetToken as jest.Mock).mockResolvedValueOnce({});
    
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(apiService.auth.verifyResetToken).toHaveBeenCalled();
    });
    
    // Find password inputs
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    // Type different passwords
    fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'different' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    
    // Check for error message
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  test('shows error when password is too short', async () => {
    // Reset API mock
    (apiService.auth.verifyResetToken as jest.Mock).mockResolvedValueOnce({});
    
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(apiService.auth.verifyResetToken).toHaveBeenCalled();
    });
    
    // Find password inputs
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    // Type short password
    fireEvent.change(passwordInputs[0], { target: { value: 'short' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'short' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    
    // Check for error message
    expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
  });

  test('successfully resets password and redirects to login', async () => {
    // Reset API mocks
    (apiService.auth.verifyResetToken as jest.Mock).mockResolvedValueOnce({});
    (apiService.auth.resetPassword as jest.Mock).mockResolvedValueOnce({});
    
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(apiService.auth.verifyResetToken).toHaveBeenCalled();
    });
    
    // Find password inputs
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    // Type matching valid passwords
    fireEvent.change(passwordInputs[0], { target: { value: 'validpassword123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'validpassword123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    
    // Check for API call
    await waitFor(() => {
      expect(apiService.auth.resetPassword).toHaveBeenCalledWith('valid-token', 'validpassword123');
    });
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText('Password Reset Successful')).toBeInTheDocument();
    });
    
    // Advance timers to trigger redirect
    jest.advanceTimersByTime(3000);
    
    // Check navigation was called
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('handles API error when resetting password', async () => {
    // Reset API mocks
    (apiService.auth.verifyResetToken as jest.Mock).mockResolvedValueOnce({});
    (apiService.auth.resetPassword as jest.Mock).mockRejectedValueOnce({
      response: {
        data: {
          message: 'Failed to reset password'
        }
      }
    });
    
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(apiService.auth.verifyResetToken).toHaveBeenCalled();
    });
    
    // Find password inputs
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    // Type matching valid passwords
    fireEvent.change(passwordInputs[0], { target: { value: 'validpassword123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'validpassword123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    
    // Check for API call
    await waitFor(() => {
      expect(apiService.auth.resetPassword).toHaveBeenCalledWith('valid-token', 'validpassword123');
    });
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to reset password')).toBeInTheDocument();
    });
  });

  test('handles generic API error when resetting password', async () => {
    // Reset API mocks
    (apiService.auth.verifyResetToken as jest.Mock).mockResolvedValueOnce({});
    (apiService.auth.resetPassword as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(apiService.auth.verifyResetToken).toHaveBeenCalled();
    });
    
    // Find password inputs
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    // Type matching valid passwords
    fireEvent.change(passwordInputs[0], { target: { value: 'validpassword123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'validpassword123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    
    // Check for API call
    await waitFor(() => {
      expect(apiService.auth.resetPassword).toHaveBeenCalledWith('valid-token', 'validpassword123');
    });
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to reset password. Please try again.')).toBeInTheDocument();
    });
  });

  test('navigates to login when back to login button is clicked', async () => {
    // Reset API mocks
    (apiService.auth.verifyResetToken as jest.Mock).mockResolvedValueOnce({});
    
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(apiService.auth.verifyResetToken).toHaveBeenCalled();
    });
    
    // Click back to login button
    fireEvent.click(screen.getByRole('button', { name: /back to login/i }));
    
    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('navigates to forgot-password when request new link button is clicked', async () => {
    // Reset API mocks and make token invalid
    (apiService.auth.verifyResetToken as jest.Mock).mockRejectedValueOnce(new Error('Invalid token'));
    
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );
    
    // Wait for error screen
    await waitFor(() => {
      expect(screen.getByText('Password Reset Failed')).toBeInTheDocument();
    });
    
    // Click request new link button
    fireEvent.click(screen.getByRole('button', { name: /request new link/i }));
    
    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  test('navigates to login from success screen', async () => {
    // Reset API mocks
    (apiService.auth.verifyResetToken as jest.Mock).mockResolvedValueOnce({});
    (apiService.auth.resetPassword as jest.Mock).mockResolvedValueOnce({});
    
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(apiService.auth.verifyResetToken).toHaveBeenCalled();
    });
    
    // Find password inputs
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    // Type matching valid passwords
    fireEvent.change(passwordInputs[0], { target: { value: 'validpassword123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'validpassword123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    
    // Wait for success screen
    await waitFor(() => {
      expect(screen.getByText('Password Reset Successful')).toBeInTheDocument();
    });
    
    // Click go to login button on success screen
    fireEvent.click(screen.getByRole('button', { name: /go to login/i }));
    
    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
}); 