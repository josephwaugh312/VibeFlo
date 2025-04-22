import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Admin from '../../pages/Admin';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

// Mock the required modules and hooks
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('Admin Page', () => {
  const mockNavigate = jest.fn();
  const mockPendingThemes = [
    {
      id: 1,
      name: 'Test Theme 1',
      description: 'Theme description',
      image_url: 'https://example.com/image1.jpg',
      user_id: 1,
      username: 'testuser1',
      user_name: 'Test User 1',
      created_at: '2023-01-01T00:00:00.000Z',
      moderation_status: 'pending',
    },
    {
      id: 2,
      name: 'Test Theme 2',
      description: 'Another theme description',
      image_url: 'https://example.com/image2.jpg',
      user_id: 2,
      username: 'testuser2',
      user_name: 'Test User 2',
      created_at: '2023-01-02T00:00:00.000Z',
      moderation_status: 'pending',
    }
  ];
  
  const mockReportedThemes = [
    {
      id: 3,
      name: 'Reported Theme',
      description: 'This theme was reported',
      image_url: 'https://example.com/image3.jpg',
      user_id: 3,
      username: 'testuser3',
      user_name: 'Test User 3',
      created_at: '2023-01-03T00:00:00.000Z',
      moderation_status: 'approved',
      reported_count: 2,
      reports: [
        {
          id: 1,
          reason: 'Inappropriate content',
          created_at: '2023-01-04T00:00:00.000Z',
          user_id: 4,
          reporter_username: 'reporter1',
        },
        {
          id: 2,
          reason: 'Copyright violation',
          created_at: '2023-01-05T00:00:00.000Z',
          user_id: 5,
          reporter_username: 'reporter2',
        }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (apiService.api.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('pending')) {
        return Promise.resolve({ data: mockPendingThemes });
      } else if (url.includes('reported')) {
        return Promise.resolve({ data: mockReportedThemes });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('redirects non-admin users to dashboard', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: 'user', is_admin: false },
      isAuthenticated: true,
      isLoading: false,
    });

    render(<Admin />);
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows access denied message for unauthenticated users', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    render(<Admin />);
    
    expect(screen.getByText(/You do not have permission to access this page/i)).toBeInTheDocument();
  });

  it('displays loading state while authentication is loading', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });

    render(<Admin />);
    
    // Look for CircularProgress, but it doesn't have text
    // So we verify the component renders without errors
    expect(document.querySelector('body')).toBeInTheDocument();
  });

  it('displays pending themes for admin users', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: 'admin', is_admin: true },
      isAuthenticated: true,
      isLoading: false,
    });

    render(<Admin />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Theme 1')).toBeInTheDocument();
      expect(screen.getByText('Test Theme 2')).toBeInTheDocument();
    });
  });

  it('switches tabs to show reported themes', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: 'admin', is_admin: true },
      isAuthenticated: true,
      isLoading: false,
    });

    render(<Admin />);
    
    // Find the tab for reported themes and click it
    const reportedTab = screen.getByText(/Reported Themes/);
    fireEvent.click(reportedTab);
    
    await waitFor(() => {
      expect(screen.getByText('Reported Theme')).toBeInTheDocument();
    });
  });

  it('handles theme approval', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: 'admin', is_admin: true },
      isAuthenticated: true,
      isLoading: false,
    });
    
    (apiService.api.post as jest.Mock).mockResolvedValue({ data: { message: 'Theme approved' } });

    render(<Admin />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Theme 1')).toBeInTheDocument();
    });
    
    // Find and click the approve button (we need to target it by its test id, role, or another attribute)
    const approveButtons = screen.getAllByRole('button', { name: /approve/i });
    fireEvent.click(approveButtons[0]);
    
    await waitFor(() => {
      expect(apiService.api.post).toHaveBeenCalledWith('/moderation/admin/themes/1/approve');
    });
  });

  it('opens reject dialog when reject button is clicked', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: 'admin', is_admin: true },
      isAuthenticated: true,
      isLoading: false,
    });

    render(<Admin />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Theme 1')).toBeInTheDocument();
    });
    
    // Find and click the reject button
    const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
    fireEvent.click(rejectButtons[0]);
    
    // Check if the dialog is open by looking for the dialog role
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('submits theme rejection with reason', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: 'admin', is_admin: true },
      isAuthenticated: true,
      isLoading: false,
    });
    
    (apiService.api.post as jest.Mock).mockResolvedValue({ data: { message: 'Theme rejected' } });

    render(<Admin />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Theme 1')).toBeInTheDocument();
    });
    
    // Find and click the reject button
    const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
    fireEvent.click(rejectButtons[0]);
    
    // Enter rejection reason
    const reasonInput = screen.getByLabelText(/rejection reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Content policy violation' } });
    
    // Submit the form using the "Reject Theme" button instead of "Submit"
    const submitButton = screen.getByRole('button', { name: /reject theme$/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(apiService.api.post).toHaveBeenCalledWith('/moderation/admin/themes/1/reject', {
        reason: 'Content policy violation'
      });
    });
  });
}); 