import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import VerifyEmail from '../../pages/VerifyEmail';
import * as apiService from '../../services/api';

// Mock the API calls
jest.mock('../../services/api', () => ({
  verifyEmail: jest.fn(),
  resendVerificationEmail: jest.fn()
}));

// Add a mock for console.error and console.log to suppress React warnings
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Mock the navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom');
  return {
    ...originalModule,
    useNavigate: () => mockNavigate,
    useParams: () => ({ token: 'test-token' })
  };
});

describe('VerifyEmail Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should make verify API call when token is provided', async () => {
    // Mock a verification call
    (apiService.verifyEmail as jest.Mock).mockResolvedValue({ success: true });

    render(
      <BrowserRouter>
        <VerifyEmail />
      </BrowserRouter>
    );

    // Wait for the API call to happen
    await waitFor(() => {
      expect(apiService.verifyEmail).toHaveBeenCalledWith('test-token');
    });
  });

  it('should display success message when verification is successful', async () => {
    // Mock successful verification
    (apiService.verifyEmail as jest.Mock).mockResolvedValue({ success: true });

    render(
      <BrowserRouter>
        <VerifyEmail />
      </BrowserRouter>
    );

    // Wait for the success message to appear
    await waitFor(() => {
      const successElement = screen.getByRole('alert');
      expect(successElement).toBeInTheDocument();
      expect(successElement).toHaveTextContent(/success/i);
    });

    // Check for the navigation button
    const loginButton = screen.getByRole('button', { name: /go to login/i });
    expect(loginButton).toBeInTheDocument();

    // Check that navigate is called when button is clicked
    fireEvent.click(loginButton);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should display error message when verification fails', async () => {
    // Mock verification failure
    const errorMessage = 'Invalid or expired token';
    (apiService.verifyEmail as jest.Mock).mockRejectedValue({
      response: { data: { message: errorMessage } }
    });

    render(
      <BrowserRouter>
        <VerifyEmail />
      </BrowserRouter>
    );

    // Wait for the error message
    await waitFor(() => {
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent(errorMessage);
    });

    // Check for resend form
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
  });

  it('should show error when no token is provided', async () => {
    // Override the useParams mock for this test only
    jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ token: undefined });

    render(
      <BrowserRouter>
        <VerifyEmail />
      </BrowserRouter>
    );

    // Wait for the error message
    await waitFor(() => {
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent('No verification token found in URL');
    });
  });

  it('should handle resending verification email successfully', async () => {
    // Mock verification failure to show resend form
    (apiService.verifyEmail as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Invalid token' } }
    });
    
    // Mock successful resend
    (apiService.resendVerificationEmail as jest.Mock).mockResolvedValue({ success: true });

    render(
      <BrowserRouter>
        <VerifyEmail />
      </BrowserRouter>
    );

    // Wait for the verification to fail and form to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    // Fill out the form
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /resend verification email/i });
    fireEvent.click(submitButton);
    
    // Verify API was called
    await waitFor(() => {
      expect(apiService.resendVerificationEmail).toHaveBeenCalledWith('test@example.com');
    });
    
    // Check for success message
    await waitFor(() => {
      const successAlerts = screen.getAllByRole('alert');
      const successAlert = successAlerts.find(alert => 
        alert.textContent?.includes('Verification email sent successfully')
      );
      expect(successAlert).toBeInTheDocument();
    });
  });

  it('should validate email before submitting resend form', async () => {
    // Mock verification failure to show resend form
    (apiService.verifyEmail as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Invalid token' } }
    });

    render(
      <BrowserRouter>
        <VerifyEmail />
      </BrowserRouter>
    );

    // Wait for the verification to fail and form to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    // Submit the form without entering an email
    fireEvent.click(screen.getByRole('button', { name: /resend verification email/i }));
    
    // API should not have been called
    expect(apiService.resendVerificationEmail).not.toHaveBeenCalled();
    
    // Wait for validation error
    await waitFor(() => {
      // Find the error alert containing the validation message
      const errorAlerts = screen.getAllByRole('alert');
      const validationError = errorAlerts.find(alert => 
        alert.textContent?.includes('Please enter your email address')
      );
      expect(validationError).toBeInTheDocument();
    });
  });
}); 