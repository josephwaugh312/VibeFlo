import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForgotPassword from '../../pages/ForgotPassword';
import { BrowserRouter } from 'react-router-dom';
import apiService from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  auth: {
    requestPasswordReset: jest.fn(),
  },
}));

// Mock fetch API
global.fetch = jest.fn() as jest.Mock;

const ForgotPasswordWithRouter = () => (
  <BrowserRouter>
    <ForgotPassword />
  </BrowserRouter>
);

describe('ForgotPassword Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders the forgot password form', () => {
    render(<ForgotPasswordWithRouter />);
    
    // Check that the heading is displayed
    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    
    // Check that submit buttons exist
    expect(screen.getByText('Send Reset Link (Direct)')).toBeInTheDocument();
    expect(screen.getByText('Try API Service')).toBeInTheDocument();
    
    // Check that navigation links exist
    expect(screen.getByText('Back to Login')).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  it('shows an error when submitting an empty form', async () => {
    render(<ForgotPasswordWithRouter />);
    
    // Submit the form without entering an email
    fireEvent.click(screen.getByText('Send Reset Link (Direct)'));
    
    // Check that error message is displayed
    expect(screen.getByText('Please enter your email address.')).toBeInTheDocument();
  });

  it('handles successful direct password reset request', async () => {
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValueOnce({ message: 'Password reset email sent' }),
    });

    render(<ForgotPasswordWithRouter />);
    
    // Enter email - find the input by its ID instead of label
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Send Reset Link (Direct)'));
    
    // Wait for successful response
    await waitFor(() => {
      expect(screen.getByText(/Password reset instructions have been sent to your email/)).toBeInTheDocument();
      expect(screen.getByText('Return to Login')).toBeInTheDocument();
    });
    
    // Check that fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5001/api/auth/forgot-password',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      })
    );
  });

  it('handles error in direct password reset request', async () => {
    // Mock failed fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: jest.fn().mockResolvedValueOnce({ message: 'Email not found' }),
    });

    render(<ForgotPasswordWithRouter />);
    
    // Enter email
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Send Reset Link (Direct)'));
    
    // Wait for error response
    await waitFor(() => {
      expect(screen.getByText('Email not found')).toBeInTheDocument();
    });
  });

  it('handles successful API service password reset request', async () => {
    // Mock successful API service response
    (apiService.auth.requestPasswordReset as jest.Mock).mockResolvedValueOnce({
      data: { message: 'Password reset email sent' }
    });

    render(<ForgotPasswordWithRouter />);
    
    // Enter email
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Submit using API service
    fireEvent.click(screen.getByText('Try API Service'));
    
    // Wait for successful response
    await waitFor(() => {
      expect(screen.getByText(/Password reset instructions have been sent to your email/)).toBeInTheDocument();
      expect(screen.getByText('Return to Login')).toBeInTheDocument();
    });
    
    // Check that API service was called with correct parameters
    expect(apiService.auth.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
  });

  it('handles error in API service password reset request', async () => {
    // Mock failed API service response
    (apiService.auth.requestPasswordReset as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'Email not registered' } }
    });

    render(<ForgotPasswordWithRouter />);
    
    // Enter email
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });
    
    // Submit using API service
    fireEvent.click(screen.getByText('Try API Service'));
    
    // Wait for error response
    await waitFor(() => {
      expect(screen.getByText('Email not registered')).toBeInTheDocument();
    });
  });

  it('handles network error in direct password reset request', async () => {
    // Mock network error in fetch
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<ForgotPasswordWithRouter />);
    
    // Enter email
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Send Reset Link (Direct)'));
    
    // Wait for error response
    await waitFor(() => {
      expect(screen.getByText('Network error when contacting server')).toBeInTheDocument();
    });
  });
}); 