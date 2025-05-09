import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Stats from '../../pages/Stats';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material';
import { useStats } from '../../contexts/StatsContext';

// Mock the StatsContext - important to do this before importing the component
jest.mock('../../contexts/StatsContext', () => {
  const originalModule = jest.requireActual('../../contexts/StatsContext');
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
    
    // Wait for the component to load (no loading spinner)
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Check for stats tabs
    const tabsElement = await screen.findByTestId('stats-tabs');
    expect(tabsElement).toBeInTheDocument();
    
    // Check that the Overview tab is selected
    const overviewTab = await screen.findByTestId('tab-overview');
    expect(overviewTab).toBeInTheDocument();
    expect(overviewTab).toHaveAttribute('aria-selected', 'true');
  });

  test('displays loading state when data is loading', async () => {
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
    const spinner = await screen.findByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
  });

  test('displays error message when stats fetch fails', async () => {
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
    const errorElement = await screen.findByTestId('error-message');
    expect(errorElement).toBeInTheDocument();
    
    // Check for retry button
    const retryButton = await screen.findByTestId('retry-button');
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveTextContent('Try Again');
  });

  test('shows empty state when no data is available', async () => {
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
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Find the session history tab
    const sessionHistoryTab = await screen.findByTestId('tab-history');
    fireEvent.click(sessionHistoryTab);
    
    // After clicking Session History tab, should see an empty state message
    const emptyState = await screen.findByTestId('empty-state');
    expect(emptyState).toBeInTheDocument();
    expect(emptyState).toHaveTextContent(/No sessions recorded yet/i);
  });

  test('switches tabs when tab buttons are clicked', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <Stats />
        </ThemeProvider>
      </MemoryRouter>
    );
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // The Overview tab should be selected by default
    const overviewTab = await screen.findByTestId('tab-overview');
    expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    
    // Click on the Trends tab
    const trendsTab = await screen.findByTestId('tab-trends');
    fireEvent.click(trendsTab);
    
    // Now the Trends tab should be selected
    await waitFor(() => {
      expect(trendsTab).toHaveAttribute('aria-selected', 'true');
      expect(overviewTab).toHaveAttribute('aria-selected', 'false');
    });
    
    // Click on the Session History tab
    const historyTab = await screen.findByTestId('tab-history');
    fireEvent.click(historyTab);
    
    // Now the History tab should be selected
    await waitFor(() => {
      expect(historyTab).toHaveAttribute('aria-selected', 'true');
      expect(trendsTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  test('changes time range when time range buttons are clicked', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <Stats />
        </ThemeProvider>
      </MemoryRouter>
    );
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Click on the Trends tab to see time range buttons
    const trendsTab = await screen.findByTestId('tab-trends');
    fireEvent.click(trendsTab);
    
    // Wait for range buttons to appear
    const days7Button = await screen.findByTestId('range-7days');
    const days30Button = await screen.findByTestId('range-30days');
    const allTimeButton = await screen.findByTestId('range-all');
    
    // 7 days should be selected by default
    expect(days7Button).toHaveClass('bg-purple-600');
    
    // Click on 30 days
    fireEvent.click(days30Button);
    
    // Now 30 days should be selected
    await waitFor(() => {
      expect(days30Button).toHaveClass('bg-purple-600');
      expect(days7Button).not.toHaveClass('bg-purple-600');
    });
    
    // Click on all time
    fireEvent.click(allTimeButton);
    
    // Now all time should be selected
    await waitFor(() => {
      expect(allTimeButton).toHaveClass('bg-purple-600');
      expect(days30Button).not.toHaveClass('bg-purple-600');
    });
  });

  test('calls refreshStats when component mounts', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <Stats />
        </ThemeProvider>
      </MemoryRouter>
    );
    
    // refreshStats should be called when the component mounts
    expect(mockRefreshStats).toHaveBeenCalledTimes(1);
  });
}); 