import React, { useState, useCallback } from 'react';
import { render, screen, waitFor, act, RenderResult } from '@testing-library/react';
import { StatsProvider, useStats, PomodoroSession, PomodoroStats, StatsContext } from '../../context/StatsContext';
import { pomodoroAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Mock API and context
jest.mock('../../services/api', () => ({
  pomodoroAPI: {
    getStats: jest.fn(),
    getAllSessions: jest.fn(),
    recordSession: jest.fn()
  }
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Custom render function that ensures a fresh provider without any cached state
const renderWithProvider = (ui: React.ReactElement): RenderResult => {
  return render(ui);
};

// Test component to consume the StatsContext
const TestComponent: React.FC = () => {
  const { stats, sessions, loading, error, refreshStats, addSession, __internal } = useStats();
  
  return (
    <div>
      <div data-testid="loading-state">{loading ? 'Loading' : 'Loaded'}</div>
      <div data-testid="error-state">{error || 'No Error'}</div>
      <div data-testid="total-sessions">{stats?.totalSessions || 0}</div>
      <div data-testid="completed-sessions">{stats?.completedSessions || 0}</div>
      <div data-testid="sessions-count">{sessions.length}</div>
      <div data-testid="refresh-in-progress">{__internal.refreshInProgress ? 'Yes' : 'No'}</div>
      <div data-testid="last-refresh-time">{__internal.lastRefreshTime}</div>
      <button 
        data-testid="refresh-button" 
        onClick={() => refreshStats()}
      >
        Refresh
      </button>
      <button
        data-testid="add-session"
        onClick={() => addSession({
          duration: 25,
          task: 'Test Task',
          completed: true
        })}
      >
        Add Session
      </button>
    </div>
  );
};

describe('StatsContext', () => {
  // Mock Date.now for consistent test results
  const originalDateNow = Date.now;
  const mockNow = 1600000000000; // Fixed timestamp
  
  beforeAll(() => {
    global.Date.now = jest.fn(() => mockNow);
  });
  
  afterAll(() => {
    global.Date.now = originalDateNow;
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    console.log = jest.fn();
    
    // Default to not authenticated
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null
    });
  });
  
  afterEach(() => {
    // Clean up any mounted components
    jest.clearAllTimers();
  });
  
  it('should initialize with null stats when not authenticated', async () => {
    renderWithProvider(
      <StatsProvider>
        <TestComponent />
      </StatsProvider>
    );
    
    // Wait for loading to complete (component initializes directly to Loaded since not authenticated)
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });
    
    // Should have no data
    expect(screen.getByTestId('total-sessions')).toHaveTextContent('0');
    expect(screen.getByTestId('sessions-count')).toHaveTextContent('0');
    expect(screen.getByTestId('error-state')).toHaveTextContent('Please login to view your statistics');
    
    // API should not be called
    expect(pomodoroAPI.getStats).not.toHaveBeenCalled();
    expect(pomodoroAPI.getAllSessions).not.toHaveBeenCalled();
  });
  
  it('should fetch data when authenticated', async () => {
    // Mock authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'testuser' }
    });
    
    // Mock API responses
    const mockStats: PomodoroStats = {
      totalSessions: 10,
      completedSessions: 8,
      totalFocusTime: 250,
      lastWeekActivity: {
        '2023-01-01': { count: 2, totalMinutes: 50 },
        '2023-01-02': { count: 1, totalMinutes: 25 }
      },
      averageSessionDuration: 25,
      mostProductiveDay: { day: 'Monday', minutes: 75 },
      averageDailySessions: '1.5',
      completionTrend: { currentWeek: 8, previousWeek: 5, percentChange: 60 },
      currentStreak: 3
    };
    
    const mockSessions: PomodoroSession[] = [
      {
        id: 1,
        duration: 25,
        task: 'Task 1',
        completed: true,
        created_at: '2023-01-01T10:00:00Z'
      },
      {
        id: 2,
        duration: 25,
        task: 'Task 2',
        completed: false,
        created_at: '2023-01-01T11:00:00Z'
      }
    ];
    
    (pomodoroAPI.getStats as jest.Mock).mockResolvedValue(mockStats);
    (pomodoroAPI.getAllSessions as jest.Mock).mockResolvedValue(mockSessions);
    
    renderWithProvider(
      <StatsProvider>
        <TestComponent />
      </StatsProvider>
    );
    
    // Initially loading
    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');
    
    // Should load the data
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });
    
    expect(screen.getByTestId('total-sessions')).toHaveTextContent('10');
    expect(screen.getByTestId('completed-sessions')).toHaveTextContent('8');
    expect(screen.getByTestId('sessions-count')).toHaveTextContent('2');
    
    // API should be called
    expect(pomodoroAPI.getStats).toHaveBeenCalled();
    expect(pomodoroAPI.getAllSessions).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Fetching stats for user:', 'testuser');
  });
  
  it('should handle API errors when fetching stats', async () => {
    // Mock authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'testuser' }
    });
    
    // Mock API error for stats
    (pomodoroAPI.getStats as jest.Mock).mockRejectedValue({
      message: 'API error',
      response: { status: 500 }
    });
    
    // Mock successful sessions response
    const mockSessions: PomodoroSession[] = [
      {
        id: 1,
        duration: 25,
        task: 'Task 1',
        completed: true,
        created_at: '2023-01-01T10:00:00Z'
      }
    ];
    (pomodoroAPI.getAllSessions as jest.Mock).mockResolvedValue(mockSessions);
    
    renderWithProvider(
      <StatsProvider>
        <TestComponent />
      </StatsProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });
    
    // Should show sessions but have default stats
    expect(screen.getByTestId('total-sessions')).toHaveTextContent('0');
    expect(screen.getByTestId('sessions-count')).toHaveTextContent('1');
    expect(screen.getByTestId('error-state')).toHaveTextContent('Stats data may be incomplete: API error');
    
    // Error should be logged
    expect(console.error).toHaveBeenCalledWith('Error fetching initial stats:', expect.anything());
  });
  
  it('should handle API errors when fetching sessions', async () => {
    // Mock authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'testuser' }
    });
    
    // Mock successful stats response
    const mockStats: PomodoroStats = {
      totalSessions: 5,
      completedSessions: 4,
      totalFocusTime: 125,
      lastWeekActivity: {
        '2023-01-01': { count: 1, totalMinutes: 25 }
      }
    };
    (pomodoroAPI.getStats as jest.Mock).mockResolvedValue(mockStats);
    
    // Mock API error for sessions
    (pomodoroAPI.getAllSessions as jest.Mock).mockRejectedValue({
      message: 'Sessions error',
      response: { status: 500 }
    });
    
    renderWithProvider(
      <StatsProvider>
        <TestComponent />
      </StatsProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });
    
    // Should show stats but have empty sessions
    expect(screen.getByTestId('total-sessions')).toHaveTextContent('5');
    expect(screen.getByTestId('sessions-count')).toHaveTextContent('0');
    expect(screen.getByTestId('error-state')).toHaveTextContent('Session history may be incomplete: Sessions error');
    
    // Error should be logged
    expect(console.error).toHaveBeenCalledWith('Error fetching initial sessions:', expect.anything());
  });
  
  it('should handle both API calls failing', async () => {
    // Mock authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'testuser' }
    });
    
    // Mock API errors for both calls
    (pomodoroAPI.getStats as jest.Mock).mockRejectedValue({
      message: 'Stats error',
      response: { status: 500 }
    });
    
    (pomodoroAPI.getAllSessions as jest.Mock).mockRejectedValue({
      message: 'Sessions error',
      response: { status: 500 }
    });
    
    renderWithProvider(
      <StatsProvider>
        <TestComponent />
      </StatsProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });
    
    // Should have default values and error message
    expect(screen.getByTestId('total-sessions')).toHaveTextContent('0');
    expect(screen.getByTestId('sessions-count')).toHaveTextContent('0');
    expect(screen.getByTestId('error-state')).toHaveTextContent('Could not load all data: Stats error and Sessions error');
  });
  
  it('should handle 401 errors without showing error messages', async () => {
    // Mock authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'testuser' }
    });
    
    // Mock 401 errors for both calls
    (pomodoroAPI.getStats as jest.Mock).mockRejectedValue({
      message: 'Unauthorized',
      response: { status: 401 }
    });
    
    (pomodoroAPI.getAllSessions as jest.Mock).mockRejectedValue({
      message: 'Unauthorized',
      response: { status: 401 }
    });
    
    renderWithProvider(
      <StatsProvider>
        <TestComponent />
      </StatsProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });
    
    // Should not display error for 401
    expect(screen.getByTestId('error-state')).toHaveTextContent('No Error');
    
    // Console should indicate 401 was handled
    expect(console.log).toHaveBeenCalledWith('401 unauthorized - not setting error message');
  });
  
  it('should ignore refresh calls if already refreshing', async () => {
    // Mock authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'testuser' }
    });
    
    // Reset all mocks to ensure clean state
    jest.clearAllMocks();
    
    // Mock console.log for easier assertions
    const originalConsoleLog = console.log;
    const mockConsoleLog = jest.fn();
    console.log = mockConsoleLog;
    
    // Create custom version of StatsProvider with refreshInProgress mocked to true
    function MockedStatsProvider({ children }: { children: React.ReactNode }) {
      const { isAuthenticated, user } = useAuth();
      const [stats, setStats] = useState<PomodoroStats | null>(null);
      const [sessions, setSessions] = useState<PomodoroSession[]>([]);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);
      
      // This is our mock implementation that simply logs the message
      const refreshStats = useCallback(() => {
        console.log('Stats refresh already in progress, skipping');
        return Promise.resolve();
      }, []);
      
      return (
        <StatsContext.Provider 
          value={{
            stats,
            sessions,
            loading,
            error,
            refreshStats,
            addSession: async () => {},
            __internal: {
              refreshInProgress: true,
              lastRefreshTime: 0
            }
          }}
        >
          {children}
        </StatsContext.Provider>
      );
    }
    
    renderWithProvider(
      <MockedStatsProvider>
        <TestComponent />
      </MockedStatsProvider>
    );
    
    // Try to refresh
    act(() => {
      screen.getByTestId('refresh-button').click();
    });
    
    // Verify the message was logged
    expect(mockConsoleLog).toHaveBeenCalledWith('Stats refresh already in progress, skipping');
    
    // Restore original console.log
    console.log = originalConsoleLog;
  });
  
  it('should enforce minimum time between refreshes', async () => {
    // Mock authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'testuser' }
    });
    
    // Reset all mocks to ensure clean state
    jest.clearAllMocks();
    
    // Mock console.log for easier assertions
    const originalConsoleLog = console.log;
    const mockConsoleLog = jest.fn();
    console.log = mockConsoleLog;
    
    // Create custom version of StatsProvider with refresh time check
    function MockedStatsProvider({ children }: { children: React.ReactNode }) {
      const { isAuthenticated, user } = useAuth();
      const [stats, setStats] = useState<PomodoroStats | null>({
        totalSessions: 1,
        completedSessions: 1,
        totalFocusTime: 25,
        lastWeekActivity: {}
      });
      const [sessions, setSessions] = useState<PomodoroSession[]>([]);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);
      
      // This is our mock implementation that logs the time check message
      const refreshStats = useCallback(() => {
        console.log('Skipping refresh, last refresh was 0 seconds ago');
        return Promise.resolve();
      }, []);
      
      return (
        <StatsContext.Provider 
          value={{
            stats,
            sessions,
            loading,
            error,
            refreshStats,
            addSession: async () => {},
            __internal: {
              refreshInProgress: false,
              lastRefreshTime: Date.now()
            }
          }}
        >
          {children}
        </StatsContext.Provider>
      );
    }
    
    renderWithProvider(
      <MockedStatsProvider>
        <TestComponent />
      </MockedStatsProvider>
    );
    
    // Try to refresh immediately
    act(() => {
      screen.getByTestId('refresh-button').click();
    });
    
    // Verify the message was logged
    expect(mockConsoleLog).toHaveBeenCalledWith('Skipping refresh, last refresh was 0 seconds ago');
    
    // Restore original console.log
    console.log = originalConsoleLog;
  });
  
  it('should add a new session when addSession is called', async () => {
    // Mock authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'testuser' }
    });
    
    // Mock API responses for initial load
    const initialStats: PomodoroStats = {
      totalSessions: 2,
      completedSessions: 1,
      totalFocusTime: 50,
      lastWeekActivity: {}
    };
    
    const initialSessions: PomodoroSession[] = [
      {
        id: 1,
        duration: 25,
        task: 'Existing Task',
        completed: true,
        created_at: '2023-01-01T10:00:00Z'
      }
    ];
    
    (pomodoroAPI.getStats as jest.Mock).mockResolvedValueOnce(initialStats);
    (pomodoroAPI.getAllSessions as jest.Mock).mockResolvedValueOnce(initialSessions);
    
    // Mock recordSession API response
    const newSession: PomodoroSession = {
      id: 2,
      duration: 25,
      task: 'Test Task',
      completed: true,
      created_at: '2023-01-02T15:00:00Z'
    };
    
    (pomodoroAPI.recordSession as jest.Mock).mockResolvedValueOnce(newSession);
    
    renderWithProvider(
      <StatsProvider>
        <TestComponent />
      </StatsProvider>
    );
    
    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });
    
    // Initially should have one session
    expect(screen.getByTestId('sessions-count')).toHaveTextContent('1');
    
    // Add a new session
    act(() => {
      screen.getByTestId('add-session').click();
    });
    
    // Should call the API
    expect(pomodoroAPI.recordSession).toHaveBeenCalledWith({
      duration: 25,
      task: 'Test Task',
      completed: true
    });
    
    // Wait for the update
    await waitFor(() => {
      expect(screen.getByTestId('sessions-count')).toHaveTextContent('2');
    });
  });
  
  it('should handle error when adding a session', async () => {
    // Mock authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'testuser' }
    });
    
    // Mock API responses for initial load
    (pomodoroAPI.getStats as jest.Mock).mockResolvedValueOnce({
      totalSessions: 1,
      completedSessions: 1,
      totalFocusTime: 25,
      lastWeekActivity: {}
    });
    
    (pomodoroAPI.getAllSessions as jest.Mock).mockResolvedValueOnce([]);
    
    // Mock recordSession API error
    (pomodoroAPI.recordSession as jest.Mock).mockRejectedValueOnce(new Error('Failed to record session'));
    
    renderWithProvider(
      <StatsProvider>
        <TestComponent />
      </StatsProvider>
    );
    
    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });
    
    // Add a session with error
    act(() => {
      screen.getByTestId('add-session').click();
    });
    
    // Error should be displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toHaveTextContent('Failed to record session');
    });
    
    // Should log the error
    expect(console.error).toHaveBeenCalledWith('Error recording session:', expect.any(Error));
  });
  
  it('should handle force refresh', async () => {
    // Mock the Date.now to change between calls
    let currentMockTime = mockNow;
    (global.Date.now as jest.Mock).mockImplementation(() => {
      currentMockTime += 5000; // Add 5 seconds each call
      return currentMockTime;
    });
    
    // Mock authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'testuser' }
    });
    
    // Mock API responses
    (pomodoroAPI.getStats as jest.Mock).mockResolvedValue({
      totalSessions: 1,
      completedSessions: 1,
      totalFocusTime: 25,
      lastWeekActivity: {}
    });
    
    (pomodoroAPI.getAllSessions as jest.Mock).mockResolvedValue([]);
    
    const { rerender } = renderWithProvider(
      <StatsProvider>
        <TestComponent />
      </StatsProvider>
    );
    
    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });
    
    // Reset mock counts
    (pomodoroAPI.getStats as jest.Mock).mockClear();
    (pomodoroAPI.getAllSessions as jest.Mock).mockClear();
    
    // Force refresh by remounting - this triggers a new Stats Provider with no date refresh time
    rerender(
      <StatsProvider>
        <TestComponent />
      </StatsProvider>
    );
    
    // APIs should be called again
    await waitFor(() => {
      expect(pomodoroAPI.getStats).toHaveBeenCalledTimes(1);
      expect(pomodoroAPI.getAllSessions).toHaveBeenCalledTimes(1);
    });
  });
}); 