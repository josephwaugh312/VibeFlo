import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { pomodoroAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Define the structure of a Pomodoro session
export interface PomodoroSession {
  id: number;
  duration: number;
  task: string;
  completed: boolean;
  created_at: string;
  start_time?: string;
  end_time?: string;
  task_name?: string;
}

// Define the structure of Pomodoro statistics
export interface PomodoroStats {
  totalSessions: number;
  completedSessions: number;
  totalFocusTime: number;
  lastWeekActivity: {
    [key: string]: {
      count: number;
      totalMinutes: number;
    };
  };
  last30DaysActivity?: {
    [key: string]: {
      count: number;
      totalMinutes: number;
    };
  };
  allTimeActivity?: {
    [key: string]: {
      count: number;
      totalMinutes: number;
    };
  };
  // New detailed metrics
  averageSessionDuration?: number;
  mostProductiveDay?: {
    day: string;
    minutes: number;
  } | null;
  averageDailySessions?: string;
  completionTrend?: {
    currentWeek: number;
    previousWeek: number;
    percentChange: number;
  };
  currentStreak?: number;
  activityHeatmap?: Array<{
    date: string;
    count: number;
    minutes: number;
  }>;
}

// Define the context structure
interface StatsContextType {
  stats: PomodoroStats | null;
  sessions: PomodoroSession[];
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  addSession: (session: Omit<PomodoroSession, 'id' | 'created_at'>) => Promise<void>;
  __internal: {
    refreshInProgress: boolean;
    lastRefreshTime: number;
  };
}

// Create the context with default values
export const StatsContext = createContext<StatsContextType>({
  stats: null,
  sessions: [],
  loading: true,
  error: null,
  refreshStats: async () => {},
  addSession: async () => {},
  __internal: {
    refreshInProgress: false,
    lastRefreshTime: 0
  },
});

// Provider component
export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState<PomodoroStats | null>(null);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retries, setRetries] = useState(0);
  const [refreshInProgress, setRefreshInProgress] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const maxRetries = 3;
  const minRefreshInterval = 5000; // 5 seconds between refreshes

  // Function to fetch both stats and sessions
  const refreshStats = useCallback(async (forceRefresh = false) => {
    // Skip if not authenticated
    if (!isAuthenticated) {
      setStats(null);
      setSessions([]);
      setLoading(false);
      setError("Please login to view your statistics.");
      return;
    }

    // Check if refresh is already in progress
    if (refreshInProgress) {
      console.log("Stats refresh already in progress, skipping");
      return;
    }
    
    // Check if minimum time between refreshes has elapsed (unless forced)
    const now = Date.now();
    if (!forceRefresh && (now - lastRefreshTime) < minRefreshInterval) {
      console.log(`Skipping refresh, last refresh was ${(now - lastRefreshTime) / 1000} seconds ago`);
      return;
    }

    try {
      setRefreshInProgress(true);
      setLoading(true);
      setError(null); // Clear previous errors
      setLastRefreshTime(now);
      console.log("Fetching stats for user:", user?.username);
      
      // Track API calls separately to handle partial failures
      let statsData: PomodoroStats | null = null;
      let sessionsData: PomodoroSession[] | null = null;
      let statsError = null;
      let sessionsError = null;
      
      try {
        statsData = await pomodoroAPI.getStats() as PomodoroStats;
        console.log("Stats API response:", statsData);
      } catch (err: any) {
        console.error('Error fetching stats:', err);
        
        // Don't set error for 401 unauthorized
        if (err.response?.status === 401) {
          console.log('401 unauthorized - not setting error message');
        } else {
          statsError = err.message || 'Failed to load statistics data';
        }
        
        // Try to use cached stats if available
        if (stats && !forceRefresh) {
          statsData = stats;
          console.log("Using cached stats data");
        }
      }
      
      try {
        sessionsData = await pomodoroAPI.getAllSessions();
        console.log("Sessions API response:", sessionsData);
      } catch (err: any) {
        console.error('Error fetching sessions:', err);
        
        // Don't set error for 401 unauthorized
        if (err.response?.status === 401) {
          console.log('401 unauthorized - not setting error message');
        } else {
          sessionsError = err.message || 'Failed to load session history';
        }
        
        // Try to use cached sessions if available
        if (sessions.length > 0 && !forceRefresh) {
          sessionsData = sessions;
          console.log("Using cached sessions data");
        }
      }
      
      // Handle the results based on what succeeded and what failed
      if (statsData) {
        // Ensure all activity objects are defined
        const safeStatsData = statsData as PomodoroStats;
        safeStatsData.lastWeekActivity = safeStatsData.lastWeekActivity || {};
        safeStatsData.last30DaysActivity = safeStatsData.last30DaysActivity || {};
        safeStatsData.allTimeActivity = safeStatsData.allTimeActivity || {};
        setStats(safeStatsData);
      }
      
      if (sessionsData) {
        setSessions(sessionsData);
      }
      
      // Set appropriate error messages
      if (statsError && sessionsError) {
        setError(`Could not load all data: ${statsError} and ${sessionsError}`);
      } else if (statsError) {
        setError(`Stats data may be incomplete: ${statsError}`);
      } else if (sessionsError) {
        setError(`Session history may be incomplete: ${sessionsError}`);
      }
    } catch (err: any) {
      console.error('Unexpected error in stats refresh:', err);
      setError(`An unexpected error occurred: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
      setRefreshInProgress(false);
    }
  }, [isAuthenticated, user, stats, sessions, refreshInProgress, lastRefreshTime, minRefreshInterval]);

  // Function to add a new session and refresh stats
  const addSession = useCallback(async (sessionData: Omit<PomodoroSession, 'id' | 'created_at'>) => {
    if (!isAuthenticated) {
      setError("Please login to save sessions.");
      return;
    }
    
    try {
      setError(null); // Clear previous errors
      
      // Create optimistic local update
      const newSession: PomodoroSession = {
        ...sessionData,
        id: -1, // Temporary ID, will be updated on refresh
        created_at: new Date().toISOString(),
      };
      
      // Add session to the local list optimistically
      setSessions(prev => [newSession, ...prev]);
      
      // Optimistically update local stats
      if (stats) {
        setStats({
          ...stats,
          totalSessions: stats.totalSessions + 1,
          completedSessions: sessionData.completed ? stats.completedSessions + 1 : stats.completedSessions,
          totalFocusTime: stats.totalFocusTime + sessionData.duration,
        });
      }
      
      // Persist to server
      try {
        await pomodoroAPI.createSession(sessionData);
        console.log("Session saved successfully");
        
        // Refresh data from server after a short delay
        setTimeout(() => refreshStats(true), 500);
      } catch (err: any) {
        console.error('Error recording session:', err);
        setError(err.message || 'Failed to record session');
        
        // Don't remove optimistic updates to preserve user experience,
        // but mark the session as potentially not saved
        setSessions(prev => 
          prev.map(s => s.id === -1 ? {...s, potentiallyUnsaved: true} : s)
        );
      }
    } catch (err: any) {
      console.error('Error in addSession:', err);
      setError(`An error occurred while adding the session: ${err.message || 'Unknown error'}`);
    }
  }, [stats, refreshStats, isAuthenticated]);

  // Fetch data when authentication status changes
  useEffect(() => {
    let isMounted = true;
    
    const initializeStats = async () => {
      if (isAuthenticated && isMounted) {
        console.log("Authentication detected, fetching stats");
        try {
          // Use a local version that's not dependent on state
          setLoading(true);
          
          // Track API calls separately to handle partial failures
          let statsData: PomodoroStats | null = null;
          let sessionsData: PomodoroSession[] | null = null;
          let statsError = null;
          let sessionsError = null;
          
          try {
            statsData = await pomodoroAPI.getStats() as PomodoroStats;
            console.log("Fetching stats for user:", user?.username);
          } catch (err: any) {
            console.error('Error fetching initial stats:', err);
            
            // Don't set error for 401 unauthorized
            if (err.response?.status === 401) {
              console.log('401 unauthorized - not setting error message');
            } else {
              statsError = err.message || 'Failed to load statistics data';
            }
          }
          
          try {
            sessionsData = await pomodoroAPI.getAllSessions();
          } catch (err: any) {
            console.error('Error fetching initial sessions:', err);
            
            // Don't set error for 401 unauthorized
            if (err.response?.status === 401) {
              console.log('401 unauthorized - not setting error message');
            } else {
              sessionsError = err.message || 'Failed to load session history';
            }
          }
          
          if (isMounted) {
            // Handle the results based on what succeeded and what failed
            if (statsData) {
              // Ensure all activity objects are defined
              const safeStatsData = statsData as PomodoroStats;
              safeStatsData.lastWeekActivity = safeStatsData.lastWeekActivity || {};
              safeStatsData.last30DaysActivity = safeStatsData.last30DaysActivity || {};
              safeStatsData.allTimeActivity = safeStatsData.allTimeActivity || {};
              setStats(safeStatsData);
            }
            
            if (sessionsData) {
              setSessions(sessionsData);
            }
            
            // Set appropriate error messages based on what failed
            if (statsError && sessionsError) {
              setError(`Could not load all data: ${statsError} and ${sessionsError}`);
            } else if (statsError) {
              setError(`Stats data may be incomplete: ${statsError}`);
            } else if (sessionsError) {
              setError(`Session history may be incomplete: ${sessionsError}`);
            } else {
              setError(null);
            }
            
            setLoading(false);
          }
        } catch (err: any) {
          if (isMounted) {
            console.error('Unexpected error in initial stats fetch:', err);
            setError(`An unexpected error occurred: ${err.message || 'Unknown error'}`);
            setLoading(false);
          }
        }
      } else if (isMounted) {
        console.log("User not authenticated, clearing stats");
        setStats(null);
        setSessions([]);
        setError("Please login to view your statistics.");
        setLoading(false);
      }
    };
    
    // Clear any existing state before initializing
    setStats(null);
    setSessions([]);
    
    initializeStats();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]); // Only depend on isAuthenticated and user

  return (
    <StatsContext.Provider
      value={{
        stats,
        sessions,
        loading,
        error,
        refreshStats: () => refreshStats(true), // Force refresh when called explicitly
        addSession,
        // Expose these for testing
        __internal: {
          refreshInProgress,
          lastRefreshTime
        }
      }}
    >
      {children}
    </StatsContext.Provider>
  );
};

// Custom hook for using the stats context
export const useStats = () => {
  const context = useContext(StatsContext);
  
  if (context === undefined) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  
  return context;
};