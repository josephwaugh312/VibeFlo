import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material';
import { MockAuthProvider, MockStatsProvider } from '../mocks/contexts';

// Create a default theme for MUI components
const theme = createTheme({
  palette: {
    primary: {
      main: '#8a2be2',
    },
  },
});

// Mock the PomodoroTimer component to avoid testing its functionality
jest.mock('../../components/pomodoro/PomodoroTimer', () => {
  return function MockPomodoroTimer() {
    return <div data-testid="pomodoro-timer">Mock Pomodoro Timer</div>;
  };
});

// Mock the StatsContext's refreshStats function to control its behavior in tests
const mockRefreshStats = jest.fn().mockResolvedValue(undefined);
const mockAddSession = jest.fn().mockResolvedValue(undefined);

// Mock the useAuth hook's return value
jest.mock('../../contexts/AuthContext', () => {
  const original = jest.requireActual('../../contexts/AuthContext');
  return {
    ...original,
    useAuth: jest.fn(),
  };
});

// Mock the useStats hook's return value
jest.mock('../../contexts/StatsContext', () => {
  const original = jest.requireActual('../../contexts/StatsContext');
  return {
    ...original,
    useStats: jest.fn(),
  };
});

describe('Dashboard Component', () => {
  // Mock user data
  const mockUser = {
    id: '1',
    username: 'testuser',
    name: 'Test User',
    email: 'test@example.com',
    bio: 'This is a test bio for the dashboard',
    created_at: '2023-01-01T00:00:00.000Z',
  };

  // Mock session data
  const mockSessions = [
    {
      id: 1,
      duration: 25,
      task: 'Task 1',
      completed: true,
      created_at: '2023-07-01T10:00:00.000Z',
    },
    {
      id: 2,
      duration: 15,
      task: 'Task 2',
      completed: false,
      created_at: '2023-07-02T11:00:00.000Z',
      potentiallyUnsaved: true,
    },
    {
      id: 3,
      duration: 30,
      task: 'Task 3',
      completed: true,
      created_at: '2023-07-03T12:00:00.000Z',
    },
  ];

  // Mock stats data
  const mockStats = {
    totalSessions: 10,
    completedSessions: 8,
    totalFocusTime: 250,
    lastWeekActivity: {
      'Monday': { count: 2, totalMinutes: 50 },
      'Wednesday': { count: 3, totalMinutes: 75 },
      'Friday': { count: 1, totalMinutes: 25 },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Import the hooks here to mock them
    const { useAuth } = require('../../contexts/AuthContext');
    const { useStats } = require('../../contexts/StatsContext');
    
    // Setup default mock values for hooks
    useAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });
    
    useStats.mockReturnValue({
      sessions: mockSessions,
      stats: mockStats,
      loading: false,
      error: null,
      refreshStats: mockRefreshStats,
      addSession: mockAddSession,
    });
  });

  // Setup helper function to render the Dashboard with our mocks
  const renderDashboard = (
    { 
      user = mockUser, 
      isAuthenticated = true,
      sessions = mockSessions,
      stats = mockStats,
      loading = false,
      error = null
    } = {}
  ) => {
    // Import the hooks here to update mocks for each test
    const { useAuth } = require('../../contexts/AuthContext');
    const { useStats } = require('../../contexts/StatsContext');
    
    // Update mock values for this test
    useAuth.mockReturnValue({
      user,
      isAuthenticated,
    });
    
    useStats.mockReturnValue({
      sessions,
      stats,
      loading,
      error,
      refreshStats: mockRefreshStats,
      addSession: mockAddSession,
    });
    
    return render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <Dashboard />
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  test('renders welcome message with user username', () => {
    renderDashboard();
    
    // Check the text content of the h1 heading
    const welcomeHeading = screen.getByRole('heading', { level: 1 });
    expect(welcomeHeading.textContent).toBe('Welcome, @testuser!');
  });

  test('displays user bio when provided', () => {
    renderDashboard();
    
    // Find the element that contains the bio (using Typography)
    const bioElement = screen.getByText('This is a test bio for the dashboard');
    expect(bioElement).toBeInTheDocument();
  });

  test('renders pomodoro timer section', () => {
    renderDashboard();
    
    // Check for the heading instead of looking for the text within the component
    expect(screen.getByRole('heading', { name: /pomodoro timer/i })).toBeInTheDocument();
    expect(screen.getByTestId('pomodoro-timer')).toBeInTheDocument();
  });

  test('renders recent sessions section', () => {
    renderDashboard();
    
    expect(screen.getByRole('heading', { name: /recent sessions/i })).toBeInTheDocument();
  });

  test('displays loading state for sessions', () => {
    // Render dashboard with loading state
    renderDashboard({ loading: true });
    
    // Check for the loading animation element
    const loadingElement = screen.getByText('', { selector: '.animate-pulse' });
    expect(loadingElement).toBeInTheDocument();
  });

  test('displays error message when sessions fetch fails', () => {
    const errorMessage = 'Failed to load sessions';
    
    renderDashboard({ error: errorMessage });
    
    // Check for the error message directly
    const errorElement = screen.getByText(errorMessage);
    expect(errorElement).toBeInTheDocument();
  });

  test('displays empty state when no sessions exist', () => {
    renderDashboard({ sessions: [] });
    
    // Check for empty state messages
    const noSessionsElement = screen.getByText('No sessions recorded yet.');
    expect(noSessionsElement).toBeInTheDocument();
    
    const instructionElement = screen.getByText('Complete a Pomodoro session to see it here!');
    expect(instructionElement).toBeInTheDocument();
  });

  test('renders recent sessions when available', () => {
    renderDashboard();
    
    // Get the rendered sessions by their task names
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
    
    // Check for session statuses
    expect(screen.getAllByText('Completed').length).toBe(2); // Two completed sessions
    expect(screen.getByText('In Progress')).toBeInTheDocument(); // One in progress
  });

  test('has a link to view all sessions', () => {
    renderDashboard();
    
    const link = screen.getByText('View all sessions →');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/stats');
  });

  test('refreshes stats when dashboard loads', async () => {
    renderDashboard();
    
    // Wait for useEffect to run and check that refreshStats was called
    await waitFor(() => {
      expect(mockRefreshStats).toHaveBeenCalledTimes(1);
    });
  });

  test('handles user without bio correctly', () => {
    const userWithoutBio = { ...mockUser, bio: '' };
    renderDashboard({ user: userWithoutBio });
    
    // Bio section should not be present
    expect(screen.queryByText(/This is a test bio/i)).not.toBeInTheDocument();
  });

  test('handles unauthenticated state gracefully', () => {
    renderDashboard({ 
      user: null, 
      isAuthenticated: false,
      sessions: [],
      stats: null
    });
    
    // Should show 'User' instead of username
    expect(screen.getByText('Welcome, @User!')).toBeInTheDocument();
  });

  test('formats date and time correctly for sessions', () => {
    renderDashboard();
    
    // Check for specific session dates
    mockSessions.forEach(session => {
      const dateString = new Date(session.created_at).toLocaleDateString();
      const timeString = new Date(session.created_at).toLocaleTimeString();
      
      // Look for the date and time in the format they appear in the component
      const dateTimeElement = screen.getByText(`${dateString} ${timeString}`);
      expect(dateTimeElement).toBeInTheDocument();
    });
  });
}); 