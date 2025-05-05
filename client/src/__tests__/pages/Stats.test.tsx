import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Stats from '../../pages/Stats';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material';
import { useStats } from '../../context/StatsContext';

// Mock the StatsContext - important to do this before importing the component
jest.mock('../../context/StatsContext', () => {
  const originalModule = jest.requireActual('../../context/StatsContext');
  return {
    ...originalModule,
    useStats: jest.fn(),
  };
});

// Recharts mock directly after
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// Create a default theme for MUI components
const theme = createTheme({
  palette: {
    primary: {
      main: '#8a2be2',
    },
  },
});

describe('Stats Component', () => {
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
    last30DaysActivity: {
      'Monday': { count: 4, totalMinutes: 100 },
      'Wednesday': { count: 6, totalMinutes: 150 },
      'Friday': { count: 2, totalMinutes: 50 },
    },
    allTimeActivity: {
      'Monday': { count: 10, totalMinutes: 250 },
      'Wednesday': { count: 15, totalMinutes: 375 },
      'Friday': { count: 5, totalMinutes: 125 },
    },
    averageSessionDuration: 25,
    mostProductiveDay: {
      day: 'Wednesday',
      minutes: 375,
    },
    averageDailySessions: '2.5',
    completionTrend: {
      currentWeek: 5,
      previousWeek: 3,
      percentChange: 66.67,
    },
    currentStreak: 3,
    activityHeatmap: [
      { date: '2023-07-01', count: 2, minutes: 50 },
      { date: '2023-07-02', count: 0, minutes: 0 },
      { date: '2023-07-03', count: 3, minutes: 75 },
    ],
  };

  // Mock refreshStats function
  const mockRefreshStats = jest.fn().mockResolvedValue(undefined);
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementation for useStats
    (useStats as jest.Mock).mockReturnValue({
      stats: mockStats,
      sessions: mockSessions,
      loading: false,
      error: null,
      refreshStats: mockRefreshStats,
      addSession: jest.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders the stats page with overview tab selected by default', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <Stats />
        </ThemeProvider>
      </MemoryRouter>
    );
    
    // Check for page title
    expect(screen.getByText('Pomodoro Statistics')).toBeInTheDocument();
    
    // Check that the Overview tab is selected - Material UI tabs
    const overviewTab = screen.getByRole('tab', { name: /Overview/i });
    expect(overviewTab).toBeInTheDocument();
    expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    
    // Check for stats content
    expect(screen.getByText('Total Sessions')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // Total sessions value
  });

  test('displays loading state when data is loading', () => {
    // Override mock to show loading state
    (useStats as jest.Mock).mockReturnValue({
      stats: null,
      sessions: [],
      loading: true,
      error: null,
      refreshStats: mockRefreshStats,
      addSession: jest.fn(),
    });
    
    render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <Stats />
        </ThemeProvider>
      </MemoryRouter>
    );
    
    // Check for loading indicator
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  test('displays error message when stats fetch fails', () => {
    const errorMessage = 'Failed to load statistics';
    
    // Override mock to show error state
    (useStats as jest.Mock).mockReturnValue({
      stats: null,
      sessions: [],
      loading: false,
      error: errorMessage,
      refreshStats: mockRefreshStats,
      addSession: jest.fn(),
    });
    
    render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <Stats />
        </ThemeProvider>
      </MemoryRouter>
    );
    
    // Check for error message
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  test('shows empty state when no data is available', () => {
    // Override mock to show empty state
    (useStats as jest.Mock).mockReturnValue({
      stats: null,
      sessions: [],
      loading: false,
      error: null,
      refreshStats: mockRefreshStats,
      addSession: jest.fn(),
    });
    
    render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <Stats />
        </ThemeProvider>
      </MemoryRouter>
    );
    
    // Click on Session History tab to see the empty state
    fireEvent.click(screen.getByText(/Session History/i));
    
    // Check for empty state message
    expect(screen.getByText(/No sessions recorded yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Complete a Pomodoro session to see your history/i)).toBeInTheDocument();
  });

  it('switches tabs when tab buttons are clicked', () => {
    render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <Stats />
        </ThemeProvider>
      </MemoryRouter>
    );
    
    // Switch to Session History tab - now using Material UI tabs
    const sessionHistoryTab = screen.getByRole('tab', { name: /Session History/i });
    fireEvent.click(sessionHistoryTab);
    
    // Check that we see the session history content (look for the heading inside the content area)
    expect(screen.getByRole('heading', { name: /Session History/i, level: 2 })).toBeInTheDocument();
    
    // Check that we see the session history content
    expect(screen.getByText(/Start Time/i)).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Task/i })).toBeInTheDocument();
    
    // Switch to Overview tab - now using Material UI tabs
    const overviewTab = screen.getByRole('tab', { name: /Overview/i });
    fireEvent.click(overviewTab);
    
    // Check that we see the overview content
    expect(screen.getByText(/Total Sessions/i)).toBeInTheDocument();
    
    // Switch to Trends tab - now using Material UI tabs
    const trendsTab = screen.getByRole('tab', { name: /Trends/i });
    fireEvent.click(trendsTab);
    
    // Check that we see the trends content
    expect(screen.getByText(/Weekly Progress/i)).toBeInTheDocument();
  });

  test('changes time range when time range buttons are clicked', () => {
    render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <Stats />
        </ThemeProvider>
      </MemoryRouter>
    );
    
    // Switch to Trends tab to see time range buttons
    fireEvent.click(screen.getByText(/Trends/i));
    
    // Check that 7 days button is selected initially
    expect(screen.getByText(/Last 7 Days/i)).toHaveClass('bg-purple-600');
    
    // Click on 30 days
    fireEvent.click(screen.getByText(/Last 30 Days/i));
    expect(screen.getByText(/Last 30 Days/i)).toHaveClass('bg-purple-600');
    
    // Click on All time
    fireEvent.click(screen.getByText(/All Time/i));
    expect(screen.getByText(/All Time/i)).toHaveClass('bg-purple-600');
  });

  test('calls refreshStats when component mounts', () => {
    render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <Stats />
        </ThemeProvider>
      </MemoryRouter>
    );
    
    expect(mockRefreshStats).toHaveBeenCalledTimes(1);
  });
}); 