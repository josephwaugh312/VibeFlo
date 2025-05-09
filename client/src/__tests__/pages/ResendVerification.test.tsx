import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material';
import ResendVerification from '../../pages/ResendVerification';
import { authAPI } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  authAPI: {
    resendVerificationEmail: jest.fn()
  }
}));

// Add a mock for console.error and console.log to suppress React warnings
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Create a theme for testing
const theme = createTheme();

// Mock the useSearchParams hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [
    {
      get: (param: string) => param === 'email' ? 'test@example.com' : null
    },
    jest.fn()
  ]
}));

describe('ResendVerification Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <ResendVerification />
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  it('should load with the email from URL parameters', () => {
    renderComponent();
    
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should display form elements correctly', () => {
    renderComponent();
    
    expect(screen.getByText(/resend verification email/i, { selector: 'h1' })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
  });

  it('should validate email before submission', async () => {
    // Override useSearchParams for this test to return empty email
    jest.spyOn(require('react-router-dom'), 'useSearchParams')
      .mockReturnValue([
        { get: () => null },
        jest.fn()
      ]);
    
    renderComponent();
    
    // Try submitting with empty email
    fireEvent.click(screen.getByRole('button', { name: /resend verification email/i }));
    
    // Should show validation error
    await waitFor(() => {
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(/please enter a valid email address/i);
    });
    
    // API should not have been called
    expect(authAPI.resendVerificationEmail).not.toHaveBeenCalled();
    
    // Enter invalid email
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    // Try submitting with invalid email
    fireEvent.click(screen.getByRole('button', { name: /resend verification email/i }));
    
    // Should show validation error
    await waitFor(() => {
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(/please enter a valid email address/i);
    });
    
    // API should not have been called
    expect(authAPI.resendVerificationEmail).not.toHaveBeenCalled();
  });

  it('should handle API call during submission', async () => {
    // Mock API call with delayed response
    (authAPI.resendVerificationEmail as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );
    
    renderComponent();
    
    // Fill in a valid email if not already populated
    const emailInput = screen.getByLabelText(/email address/i);
    if (!emailInput.getAttribute('value')) {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    }
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /resend verification email/i });
    fireEvent.click(submitButton);
    
    // Verify API was called
    await waitFor(() => {
      expect(authAPI.resendVerificationEmail).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('should handle API errors', async () => {
    // Mock API error
    const errorMessage = 'Email not found in our system';
    (authAPI.resendVerificationEmail as jest.Mock).mockResolvedValue({ 
      success: false, 
      message: errorMessage 
    });
    
    renderComponent();
    
    // Fill in a valid email if not already populated
    const emailInput = screen.getByLabelText(/email address/i);
    if (!emailInput.getAttribute('value')) {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    }
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /resend verification email/i }));
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(authAPI.resendVerificationEmail).toHaveBeenCalledWith('test@example.com');
    });
    
    // Check for error in the document
    await waitFor(() => {
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(errorMessage);
    });
    
    // Should stay on the form page
    expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
  });

  it('should handle network errors', async () => {
    // Mock network error
    (authAPI.resendVerificationEmail as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    renderComponent();
    
    // Fill in a valid email if not already populated
    const emailInput = screen.getByLabelText(/email address/i);
    if (!emailInput.getAttribute('value')) {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    }
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /resend verification email/i }));
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(authAPI.resendVerificationEmail).toHaveBeenCalledWith('test@example.com');
    });
    
    // Check for error in the document
    await waitFor(() => {
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(/an error occurred/i);
    });
  });
}); 