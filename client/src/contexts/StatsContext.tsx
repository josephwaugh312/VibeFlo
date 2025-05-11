import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
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
  // Add a property to mark potentially unsaved sessions
  potentiallyUnsaved?: boolean;
}

// Define the structure of Pomodoro statistics
export interface PomodoroStats {
  totalSessions: number;
  completedSessions: number;
  totalFocusTime: number;
  totalFocusTimeMinutes?: number;
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
  averageSessionDurationMinutes?: number;
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
  heatmapData?: Array<{
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

// Helper function to debounce function calls
const debounce = <T extends (...args: any[]) => Promise<void>>(fn: T, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>): Promise<void> => {
    return new Promise<void>((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          await fn(...args);
          resolve();
        } catch (error) {
          console.error("Error in debounced function:", error);
          // Still resolve the promise so we don't hang
          resolve();
        }
      }, delay);
    });
  };
};

// Provider component
export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState<PomodoroStats | null>(null);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track if a refresh is in progress to prevent concurrent calls
  const isRefreshing = useRef(false);
  // Track the last successful refresh time 
  const lastRefreshTime = useRef<number>(0);

  // Function to fetch both stats and sessions with debounce
  const refreshStats = useCallback(async () => {
    // If not authenticated, don't refresh
    if (!isAuthenticated || !user) {
      console.log("Not authenticated or no user, skipping refresh");
      return;
    }
    
    // If already refreshing, skip
    if (isRefreshing.current) {
      console.log("Already refreshing, skipping");
      return;
    }

    // If refreshed recently, skip unless forceRefresh is true
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime.current;
    
    // Increase throttling if we're getting server errors
    // Don't refresh more frequently than every 60 seconds for normal operation
    // But if we've had persistent server errors, throttle more aggressively
    if (lastRefreshTime.current > 0) {
      // Check if we've had a server error recently
      const hasRecentServerError = error?.includes('500') || error?.includes('server error');
      const minWaitTime = hasRecentServerError ? 120000 : 60000; // 2 minutes if server error, 1 minute otherwise
      
      if (timeSinceLastRefresh < minWaitTime) {
        console.log(`Skipping refresh, last refresh was ${timeSinceLastRefresh}ms ago, minimum wait is ${minWaitTime}ms due to ${hasRecentServerError ? 'server errors' : 'normal throttling'}`);
        return;
      }
    }

    // Mark as refreshing to prevent concurrent calls
    isRefreshing.current = true;

    try {
      setLoading(true);
      setError(null); // Clear previous errors
      console.log("Fetching stats for user:", user?.username);
      
      // Track API calls separately to handle partial failures
      let statsData = null;
      let sessionsData: any[] = [];
      let statsError = null;
      let sessionsError = null;
      let statsApiAttempted = false;
      let sessionsApiAttempted = false;
      
      // Maximum retry attempts
      const maxRetries = 2;
      let retryCount = 0;
      
      // Add retry count and back-off delay to prevent hammering the server
      const getStatsWithRetry = async (): Promise<void> => {
        if (statsApiAttempted) return; // Only attempt once in this refresh cycle
        
        statsApiAttempted = true;
        try {
          statsData = await pomodoroAPI.getStats() as PomodoroStats;
          console.log("Stats API response:", statsData);
          // Set the last successful refresh time
          lastRefreshTime.current = Date.now();
        } catch (err: any) {
          console.error('Error fetching stats:', err);
          
          // Don't treat 401 as an error that needs to be shown to the user
          if (err.response?.status === 401) {
            console.log("401 unauthorized - not setting error message");
          } else if (err.response?.status === 500) {
            // Don't retry on 500 server errors - server likely has an issue
            statsError = `Server error (500): The API is currently experiencing issues`;
            console.log("Server error (500) - not retrying");
          } else if (err.response?.status === 500 && retryCount < maxRetries) {
            // Only retry 500 errors, and limit retries
            retryCount++;
            console.log(`Server error, retry attempt ${retryCount}/${maxRetries}`);
            // Exponential backoff
            const backoffTime = 1000 * Math.pow(2, retryCount);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            return getStatsWithRetry();
          } else {
            statsError = err.message || 'Failed to load statistics data';
          }
          
          // Try to use cached stats if available
          if (stats) {
            statsData = stats;
            console.log("Using cached stats data");
          } else {
            // Create default empty stats
            statsData = {
              totalSessions: 0,
              completedSessions: 0,
              totalFocusTime: 0,
              totalFocusTimeMinutes: 0,
              lastWeekActivity: {},
              last30DaysActivity: {},
              allTimeActivity: {},
              averageSessionDuration: 0,
              averageSessionDurationMinutes: 0,
              mostProductiveDay: null,
              averageDailySessions: "0",
              completionTrend: {
                currentWeek: 0,
                previousWeek: 0,
                percentChange: 0
              },
              currentStreak: 0,
              activityHeatmap: [],
              heatmapData: []
            };
            console.log("Created default empty stats");
          }
        }
      };
      
      // Same pattern for sessions
      const getSessionsWithRetry = async (): Promise<void> => {
        if (sessionsApiAttempted) return; // Only attempt once in this refresh cycle
        
        sessionsApiAttempted = true;
        try {
          sessionsData = await pomodoroAPI.getAllSessions();
          console.log("Sessions API response:", sessionsData);
          // Set the last successful refresh time
          lastRefreshTime.current = Date.now();
        } catch (err: any) {
          console.error('Error fetching sessions:', err);
          
          // Don't treat 401 as an error that needs to be shown to the user
          if (err.response?.status === 401) {
            console.log("401 unauthorized - not setting error message");
          } else if (err.response?.status === 500) {
            // Don't retry on 500 server errors - server likely has an issue
            sessionsError = `Server error (500): The API is currently experiencing issues`;
            console.log("Server error (500) - not retrying");
          } else if (err.response?.status === 500 && retryCount < maxRetries) {
            // Only retry 500 errors, and limit retries
            retryCount++;
            console.log(`Server error, retry attempt ${retryCount}/${maxRetries}`);
            // Exponential backoff
            const backoffTime = 1000 * Math.pow(2, retryCount);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            return getSessionsWithRetry();
          } else {
            sessionsError = err.message || 'Failed to load session history';
          }
          
          // Try to use cached sessions if available
          if (sessions.length > 0) {
            sessionsData = sessions;
            console.log("Using cached sessions data");
          } else {
            // Create empty sessions array
            sessionsData = [];
            console.log("Using empty sessions array");
          }
        }
      };
      
      // Get stats and sessions
      await getStatsWithRetry();
      await getSessionsWithRetry();
      
      // Handle the results based on what succeeded and what failed
      if (statsData) {
        // Ensure all activity objects are defined using a properly typed approach
        const typedStatsData = statsData as any; // Use 'any' temporarily to handle property name mismatch
        
        console.log("Raw stats data from server:", typedStatsData);
        
        // Server returns totalMinutes, but frontend expects totalFocusTime
        // Server returns averageSessionMinutes, but frontend might expect averageSessionDuration
        // Create a properly transformed stats object that works with our UI
        const safeStats: PomodoroStats = {
          totalSessions: typedStatsData.totalSessions || 0,
          completedSessions: typedStatsData.completedSessions || 0,
          
          // Map totalMinutes from server to totalFocusTime for frontend
          totalFocusTime: typedStatsData.totalMinutes || 0,
          totalFocusTimeMinutes: typedStatsData.totalMinutes || 0,
          
          // Other stats fields may not be on the server response
          lastWeekActivity: typedStatsData.lastWeekActivity || {},
          last30DaysActivity: typedStatsData.last30DaysActivity || {},
          allTimeActivity: typedStatsData.allTimeActivity || {},
          
          // Map averageSessionMinutes from server to averageSessionDuration for frontend
          averageSessionDuration: typedStatsData.averageSessionMinutes || 0,
          averageSessionDurationMinutes: typedStatsData.averageSessionMinutes || 0,
          
          // Default values for missing fields
          mostProductiveDay: typedStatsData.mostProductiveDay || null,
          averageDailySessions: typedStatsData.averageDailySessions || (typedStatsData.totalSessions ? (typedStatsData.totalSessions / 7).toFixed(2) : "0.00"),
          completionTrend: typedStatsData.completionTrend || {
            currentWeek: 0,
            previousWeek: 0,
            percentChange: 0
          },
          currentStreak: typedStatsData.currentStreak || 0,
          activityHeatmap: typedStatsData.activityHeatmap || typedStatsData.heatmapData || []
        };
        
        console.log("Processed stats with focus time:", safeStats.totalFocusTime, "minutes");
        console.log("Average session duration:", safeStats.averageSessionDuration, "minutes");
        
        setStats(safeStats);
      }
      
      if (sessionsData) {
        // Properly process the server response for sessions
        // Filter out any "unsaved" sessions that might have been added optimistically
        // but now we have the real data from the server
        const sessionArray = Array.isArray(sessionsData) ? sessionsData : [];
        const realSessions = sessionArray.map((session: any) => {
          // Calculate duration if it's not already provided
          let duration = session.duration;
          if (!duration && session.start_time && session.end_time) {
            try {
              const startTime = new Date(session.start_time).getTime();
              const endTime = new Date(session.end_time).getTime();
              duration = Math.round((endTime - startTime) / 60000); // Convert ms to minutes
            } catch (e) {
              console.error("Error calculating session duration:", e);
              duration = 0;
            }
          }
          
          // Ensure each session has the required fields for the UI
          return {
            id: session.id,
            duration: duration || 0,
            task: session.task || 'Completed Pomodoro',
            completed: session.completed !== undefined ? session.completed : true,
            created_at: session.created_at,
            start_time: session.start_time,
            end_time: session.end_time,
            task_name: session.task_name || session.task,
          };
        });
        
        console.log(`Processed ${realSessions.length} sessions from server`);
        setSessions(realSessions);
      }
      
      // Set appropriate error messages - only if we have real errors (not 401s)
      if (statsError && sessionsError) {
        setError(`Could not load all data: ${statsError} and ${sessionsError}`);
      } else if (statsError) {
        setError(`Stats data may be incomplete: ${statsError}`);
      } else if (sessionsError) {
        setError(`Session history may be incomplete: ${sessionsError}`);
      }
    } catch (err: any) {
      console.error('Unexpected error in stats refresh:', err);
      // Don't show 401 errors to the user
      if (err.response?.status !== 401) {
        setError(`An unexpected error occurred: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
      // Mark as no longer refreshing
      isRefreshing.current = false;
    }
  }, [isAuthenticated, user, stats, sessions]);

  // Force a refresh of stats and sessions data
  const forceRefresh = useCallback(async (): Promise<void> => {
    console.log("Force refresh requested");
    
    // Reset the refresh timer and flags
    lastRefreshTime.current = 0;
    isRefreshing.current = false;
    
    // Call the refresh function directly
    await refreshStats();
  }, [refreshStats]);

  // Debounced version of refreshStats with proper Promise handling
  const debouncedRefreshStats = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      console.log("Not authenticated, skipping refresh");
      return;
    }
    
    // Add a stronger throttling mechanism
    const now = Date.now();
    if (lastRefreshTime.current > 0) {
      const timeSinceLastRefresh = now - lastRefreshTime.current;
      
      // If we've refreshed in the last 10 seconds and had an error, wait at least 30 seconds
      if (timeSinceLastRefresh < 10000 && error) {
        console.log(`Skipping refresh due to recent error, last refresh was ${timeSinceLastRefresh/1000}s ago`);
        return;
      }
      
      // If we've refreshed in the last 30 seconds, wait
      if (timeSinceLastRefresh < 30000) {
        console.log(`Skipping refresh, last refresh was ${timeSinceLastRefresh/1000}s ago`);
        return;
      }
    }
    
    console.log("Debounced refresh called");
    try {
      // Directly call refreshStats - we've already built-in throttling in the refreshStats function
      await refreshStats();
    } catch (error) {
      console.error("Error in debouncedRefreshStats:", error);
    }
  }, [refreshStats, isAuthenticated, error]);

  // Function to add a new session and refresh stats
  const addSession = useCallback(async (sessionData: Omit<PomodoroSession, 'id' | 'created_at'>) => {
    if (!isAuthenticated) {
      setError("Please login to save sessions.");
      return;
    }
    
    try {
      setError(null); // Clear previous errors
      
      // Create optimistic local update with calculated fields
      const now = new Date().toISOString();
      const newSession: PomodoroSession = {
        ...sessionData,
        id: -1, // Temporary ID, will be updated on refresh
        created_at: now, // Use current time as created_at
        // Ensure start_time and end_time fields exist
        start_time: sessionData.start_time || now,
        end_time: sessionData.end_time || now,
      };
      
      console.log("Adding optimistic session:", newSession);
      
      // Add session to the local list optimistically - at the beginning
      setSessions(prev => {
        // Make sure we don't add duplicates
        const filteredPrev = prev.filter(s => s.id !== -1);
        return [newSession, ...filteredPrev];
      });
      
      // Optimistically update local stats
      if (stats) {
        const updatedStats: PomodoroStats = {
          totalSessions: stats.totalSessions + 1,
          completedSessions: sessionData.completed ? stats.completedSessions + 1 : stats.completedSessions,
          totalFocusTime: stats.totalFocusTime + sessionData.duration,
          totalFocusTimeMinutes: stats.totalFocusTimeMinutes,
          lastWeekActivity: stats.lastWeekActivity,
          last30DaysActivity: stats.last30DaysActivity || {},
          allTimeActivity: stats.allTimeActivity || {},
          averageSessionDuration: stats.averageSessionDuration,
          averageSessionDurationMinutes: stats.averageSessionDurationMinutes,
          mostProductiveDay: stats.mostProductiveDay,
          averageDailySessions: stats.averageDailySessions,
          completionTrend: stats.completionTrend,
          currentStreak: stats.currentStreak,
          activityHeatmap: stats.activityHeatmap,
          heatmapData: stats.heatmapData
        };
        setStats(updatedStats);
      }
      
      // Persist to server
      try {
        // Send fields in the format expected by the server
        const serverSessionData = {
          ...sessionData,
          // Ensure all necessary fields are included
          task: sessionData.task || 'Completed Pomodoro',
          completed: sessionData.completed !== undefined ? sessionData.completed : true,
          start_time: sessionData.start_time,
          end_time: sessionData.end_time,
        };
        
        console.log("Sending session to server:", serverSessionData);
        const result = await pomodoroAPI.createSession(serverSessionData);
        console.log("Session saved successfully:", result);
        
        // Reset the refresh timer and flags to ensure we do a full refresh
        lastRefreshTime.current = 0;
        isRefreshing.current = false;
        
        // Do an immediate refresh to get the latest data
        await refreshStats();
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
              // Ensure all activity objects are defined using a properly typed approach
              const typedStatsData = statsData as PomodoroStats;
              const safeStats: PomodoroStats = {
                totalSessions: typedStatsData.totalSessions,
                completedSessions: typedStatsData.completedSessions,
                totalFocusTime: typedStatsData.totalFocusTime || typedStatsData.totalFocusTimeMinutes || 0,
                totalFocusTimeMinutes: typedStatsData.totalFocusTimeMinutes,
                lastWeekActivity: typedStatsData.lastWeekActivity || {},
                last30DaysActivity: typedStatsData.last30DaysActivity || {},
                allTimeActivity: typedStatsData.allTimeActivity || {},
                averageSessionDuration: typedStatsData.averageSessionDuration || typedStatsData.averageSessionDurationMinutes || 0,
                averageSessionDurationMinutes: typedStatsData.averageSessionDurationMinutes,
                mostProductiveDay: typedStatsData.mostProductiveDay,
                averageDailySessions: typedStatsData.averageDailySessions,
                completionTrend: typedStatsData.completionTrend,
                currentStreak: typedStatsData.currentStreak,
                activityHeatmap: typedStatsData.activityHeatmap || typedStatsData.heatmapData
              };
              setStats(safeStats);
            }
            
            if (sessionsData) {
              const sessionArray = Array.isArray(sessionsData) ? sessionsData : [];
              setSessions(sessionArray);
            }
            
            setLoading(false);
            setError(null);
          }
        } catch (err: any) {
          if (isMounted) {
            console.error('Error fetching initial stats:', err);
            setError(`Failed to load initial data: ${err.message || 'Unknown error'}`);
            setLoading(false);
          }
        }
      } else if (!isAuthenticated && isMounted) {
        // Clear stats when logged out
        setStats(null);
        setSessions([]);
        setLoading(false);
        setError("Please login to view your statistics.");
      }
    };
    
    initializeStats();
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  return (
    <StatsContext.Provider value={{ 
      stats, 
      sessions, 
      loading, 
      error, 
      refreshStats: debouncedRefreshStats,
      addSession 
    }}>
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
};

export default StatsContext; 