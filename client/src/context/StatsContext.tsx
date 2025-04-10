import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { pomodoroAPI } from '../services/api';
import { useAuth } from './AuthContext';

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
}

// Create the context with default values
const StatsContext = createContext<StatsContextType>({
  stats: null,
  sessions: [],
  loading: true,
  error: null,
  refreshStats: async () => {},
  addSession: async () => {},
});

// Provider component
export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState<PomodoroStats | null>(null);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retries, setRetries] = useState(0);
  const maxRetries = 3;

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

    try {
      setLoading(true);
      setError(null); // Clear previous errors
      console.log("Fetching stats for user:", user?.username);
      
      // Track API calls separately to handle partial failures
      let statsData;
      let sessionsData;
      let statsError = null;
      let sessionsError = null;
      
      try {
        statsData = await pomodoroAPI.getStats();
        console.log("Stats API response:", statsData);
      } catch (err: any) {
        console.error('Error fetching stats:', err);
        statsError = err.message || 'Failed to load statistics data';
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
        sessionsError = err.message || 'Failed to load session history';
        // Try to use cached sessions if available
        if (sessions.length > 0 && !forceRefresh) {
          sessionsData = sessions;
          console.log("Using cached sessions data");
        }
      }
      
      // Handle the results based on what succeeded and what failed
      if (statsData) {
        // Ensure all activity objects are defined
        statsData.lastWeekActivity = statsData.lastWeekActivity || {};
        statsData.last30DaysActivity = statsData.last30DaysActivity || {};
        statsData.allTimeActivity = statsData.allTimeActivity || {};
        setStats(statsData);
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
    }
  }, [isAuthenticated, user, stats, sessions]);

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
        console.error('Error saving session to server:', err);
        setError(`Failed to save session: ${err.message || 'Unknown error'}. Local changes will be lost on reload.`);
        
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
          const statsData = await pomodoroAPI.getStats();
          const sessionsData = await pomodoroAPI.getAllSessions();
          
          if (isMounted) {
            if (statsData) {
              statsData.lastWeekActivity = statsData.lastWeekActivity || {};
              statsData.last30DaysActivity = statsData.last30DaysActivity || {};
              statsData.allTimeActivity = statsData.allTimeActivity || {};
              setStats(statsData);
            }
            
            if (sessionsData) {
              setSessions(sessionsData);
            }
            
            setLoading(false);
            setError(null);
          }
        } catch (err: any) {
          if (isMounted) {
            console.error('Error fetching initial stats:', err);
            setError('Failed to load initial statistics. Please try again later.');
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
    
    initializeStats();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]); // Only depend on isAuthenticated, not on refreshStats

  return (
    <StatsContext.Provider
      value={{
        stats,
        sessions,
        loading,
        error,
        refreshStats: () => refreshStats(true), // Force refresh when called explicitly
        addSession,
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