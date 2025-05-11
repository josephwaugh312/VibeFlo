import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useStats } from './StatsContext';
import { useAuth } from './AuthContext';
import { useSettings } from '../context/SettingsContext';
import toast from 'react-hot-toast';

// Timer states
export enum TimerState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

// Timer types
export enum TimerType {
  POMODORO = 'pomodoro',
  SHORT_BREAK = 'short_break',
  LONG_BREAK = 'long_break',
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  recordedInStats: boolean;
}

interface TimerContextType {
  timeLeft: number;
  timerState: TimerState;
  timerType: TimerType;
  completedPomodoros: number;
  currentTask: string;
  todoItems: Todo[];
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  formatTime: (seconds: number) => string;
  setCurrentTask: (task: string) => void;
  updateTodoItems: (todos: Todo[]) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const STORAGE_KEY = 'vibeflo_timer_state';
const DEFAULT_POMODORO_DURATION = 25;

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addSession, refreshStats } = useStats();
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  
  // Timer state management
  const [timeLeft, setTimeLeft] = useState<number>(
    (settings?.pomodoro_duration || DEFAULT_POMODORO_DURATION) * 60
  );
  const [timerState, setTimerState] = useState<TimerState>(TimerState.IDLE);
  const [timerType, setTimerType] = useState<TimerType>(TimerType.POMODORO);
  const [completedPomodoros, setCompletedPomodoros] = useState<number>(0);
  const [currentTask, setCurrentTask] = useState<string>('');
  const [todoItems, setTodoItems] = useState<Todo[]>([]);
  
  // Refs for timer management
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  // Add a ref to track total active time (accounting for pauses)
  const activeTimeRef = useRef<number>(0);
  // Track paused time
  const pauseTimeRef = useRef<number>(0);
  // Track the intended duration (in minutes)
  const intendedDurationRef = useRef<number>(DEFAULT_POMODORO_DURATION);
  
  // Load timer state from storage on initial mount
  useEffect(() => {
    const loadTimerState = () => {
      try {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          
          // If we have a saved state with running/paused timer, calculate the correct time left
          if (parsedState.timerState === TimerState.RUNNING) {
            // Calculate elapsed time since last save
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - parsedState.lastTimestamp) / 1000);
            const newTimeLeft = Math.max(0, parsedState.timeLeft - elapsedSeconds);
            
            setTimeLeft(newTimeLeft);
            
            // If timer should be completed, handle that in the next effect cycle
            if (newTimeLeft <= 0) {
              setTimerState(TimerState.COMPLETED);
            } else {
              setTimerState(TimerState.RUNNING);
              // Start timer again
              startTimerInternal(newTimeLeft);
            }
          } else {
            setTimeLeft(parsedState.timeLeft);
            setTimerState(parsedState.timerState);
          }
          
          setTimerType(parsedState.timerType);
          setCompletedPomodoros(parsedState.completedPomodoros);
          setCurrentTask(parsedState.currentTask || '');
          setTodoItems(parsedState.todoItems || []);
          startTimeRef.current = parsedState.startTime || 0;
        }
      } catch (error) {
        console.error('Error loading timer state:', error);
      }
    };
    
    loadTimerState();
    
    // Setup visibility change listener for browser tab changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', saveTimerState);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', saveTimerState);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Handle when the timer completes
  useEffect(() => {
    if (timeLeft <= 0 && timerState === TimerState.RUNNING) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // If a pomodoro was completed
      if (timerType === TimerType.POMODORO) {
        setCompletedPomodoros(prev => prev + 1);
        
        // Record completed tasks in stats
        recordCompletedTasks();
        
        // Determine which break to take
        const newCompletedPomodoros = completedPomodoros + 1;
        if (newCompletedPomodoros % (settings?.pomodoros_until_long_break || 4) === 0) {
          setTimerType(TimerType.LONG_BREAK);
          setTimeLeft((settings?.long_break_duration || 15) * 60);
        } else {
          setTimerType(TimerType.SHORT_BREAK);
          setTimeLeft((settings?.short_break_duration || 5) * 60);
        }

        // Auto start breaks if enabled
        if (settings?.auto_start_breaks) {
          setTimeout(() => startTimerInternal(), 1000);
        }
      } else {
        // After a break, go back to pomodoro
        setTimerType(TimerType.POMODORO);
        setTimeLeft((settings?.pomodoro_duration || DEFAULT_POMODORO_DURATION) * 60);
        
        // Auto start pomodoros if enabled
        if (settings?.auto_start_pomodoros) {
          setTimeout(() => startTimerInternal(), 1000);
        }
      }
      
      setTimerState(TimerState.COMPLETED);
      
      // Play a sound to indicate completion if enabled
      if (settings?.sound_enabled) {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(error => console.error('Error playing notification sound:', error));
      }
      
      // Show browser notification if supported and enabled
      if (settings?.notification_enabled && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(timerType === TimerType.POMODORO ? 'Time for a break!' : 'Break is over, time to focus!');
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(timerType === TimerType.POMODORO ? 'Time for a break!' : 'Break is over, time to focus!');
            }
          });
        }
      }
    }
  }, [timeLeft, timerState, timerType, settings, completedPomodoros]);
  
  // Update timer values when settings change
  useEffect(() => {
    if (!settings) return;
    
    // Only update the time if the timer is not running or paused
    if (timerState !== TimerState.RUNNING && timerState !== TimerState.PAUSED) {
      let duration = 0;
      if (timerType === TimerType.POMODORO) {
        duration = settings.pomodoro_duration || DEFAULT_POMODORO_DURATION;
      } else if (timerType === TimerType.SHORT_BREAK) {
        duration = settings.short_break_duration || 5;
      } else if (timerType === TimerType.LONG_BREAK) {
        duration = settings.long_break_duration || 15;
      }
      
      setTimeLeft(duration * 60);
    }
  }, [settings, timerType, timerState]);
  
  // Handle tab visibility changes to maintain timer accuracy
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      // Tab is visible again
      if (timerState === TimerState.RUNNING) {
        // Recalculate time left based on elapsed time
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - parsedState.lastTimestamp) / 1000);
          const newTimeLeft = Math.max(0, parsedState.timeLeft - elapsedSeconds);
          
          // Update the timer
          setTimeLeft(newTimeLeft);
          
          // If timer should be completed
          if (newTimeLeft <= 0) {
            setTimerState(TimerState.COMPLETED);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          } else {
            // Restart the interval with the new time
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            startTimerInternal(newTimeLeft);
          }
        }
      }
    } else {
      // Tab is hidden, save the current state
      saveTimerState();
    }
  }, [timerState]);
  
  // Save timer state to localStorage
  const saveTimerState = useCallback(() => {
    try {
      const state = {
        timeLeft,
        timerState,
        timerType,
        completedPomodoros,
        currentTask,
        todoItems,
        startTime: startTimeRef.current,
        lastTimestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      lastTimestampRef.current = Date.now();
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  }, [timeLeft, timerState, timerType, completedPomodoros, currentTask, todoItems]);
  
  // Record completed tasks from the todo list
  const recordCompletedTasks = useCallback(async () => {
    console.log("Recording completed task...");
    
    // Only proceed if user is authenticated
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping stats recording');
      return;
    }

    try {
      // Get all completed todo items
      const completedTodos = todoItems.filter(todo => todo.completed);
      
      // Prepare task description - use completed todos or current task
      let taskDescription = "Completed Pomodoro";
      
      if (completedTodos.length > 0) {
        // Use completed todo texts
        taskDescription = completedTodos.map(todo => todo.text).join(", ");
      } else if (currentTask && currentTask.trim()) {
        // Use current task as fallback
        taskDescription = currentTask;
      }
      
      // Calculate actual session duration
      const endTime = Date.now();
      const startTime = startTimeRef.current;
      
      // Add the final segment of active time
      if (lastTimestampRef.current > 0) {
        activeTimeRef.current += (endTime - lastTimestampRef.current);
      }
      
      // Calculate duration based on active time, not wall clock time
      const activeMinutes = Math.floor(activeTimeRef.current / 60000); // Use floor to not overstate time
      
      // Use active time, but if it's 0 or negative use the intended duration as a fallback
      let actualDuration = activeMinutes > 0 ? 
        activeMinutes : 
        intendedDurationRef.current;
      
      // Ensure duration makes sense - should generally be close to intended duration
      const intendedDuration = intendedDurationRef.current;
      
      // Log detailed duration information for debugging
      console.log(`Session duration calculation:
        - Start time: ${new Date(startTime).toISOString()}
        - End time: ${new Date(endTime).toISOString()}
        - Wall clock elapsed: ${Math.floor((endTime - startTime) / 60000)} minutes
        - Active time: ${activeMinutes} minutes
        - Intended duration: ${intendedDuration} minutes
        - Final duration to record: ${actualDuration} minutes
      `);
      
      // If the calculated active time is way off from the intended duration,
      // this suggests a potential calculation error - use intended duration as a backup
      if (activeMinutes <= 0 || activeMinutes > intendedDuration * 2) {
        console.warn(`Calculated duration (${activeMinutes} min) seems incorrect compared to intended duration (${intendedDuration} min). Using intended duration.`);
        actualDuration = intendedDuration;
      }
      
      await addSession({
        duration: actualDuration,
        task: taskDescription,
        completed: true,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString()
      });
      
      toast.success('Session recorded!');
      
      // Reset active time tracking
      activeTimeRef.current = 0;
      lastTimestampRef.current = 0;
      
      // Force refresh stats after adding a session
      await refreshStats();
    } catch (error) {
      console.error('Error in recordCompletedTasks:', error);
    }
  }, [currentTask, todoItems, isAuthenticated, addSession, refreshStats, settings]);
  
  // Internal timer start function
  const startTimerInternal = useCallback((initialTimeLeft?: number) => {
    // If we're starting a new timer (not resuming from pause)
    if (timerState !== TimerState.PAUSED) {
      startTimeRef.current = Date.now();
      lastTimestampRef.current = Date.now();
      activeTimeRef.current = 0; // Reset active time counter
      
      // Store the intended duration based on timer type
      if (timerType === TimerType.POMODORO) {
        intendedDurationRef.current = settings?.pomodoro_duration || DEFAULT_POMODORO_DURATION;
      } else if (timerType === TimerType.SHORT_BREAK) {
        intendedDurationRef.current = settings?.short_break_duration || 5;
      } else {
        intendedDurationRef.current = settings?.long_break_duration || 15;
      }
      
      console.log(`Starting new timer with intended duration: ${intendedDurationRef.current} minutes`);
    } else {
      // If resuming from pause, update the last timestamp
      lastTimestampRef.current = Date.now();
      console.log(`Resuming timer. Active time so far: ${Math.round(activeTimeRef.current / 60000)} minutes`);
    }
    
    setTimerState(TimerState.RUNNING);
    
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newValue = prev - 1;
        // Save state every 5 seconds for persistence
        if (newValue % 5 === 0) {
          saveTimerState();
        }
        
        if (newValue <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return newValue;
      });
    }, 1000);
    
    // If we're given an initial time, set it
    if (initialTimeLeft !== undefined) {
      setTimeLeft(initialTimeLeft);
    }
    
    // Save state immediately when starting
    saveTimerState();
  }, [timerState, timerType, settings, saveTimerState]);
  
  // Public API methods
  const startTimer = useCallback(() => {
    startTimerInternal();
  }, [startTimerInternal]);
  
  const pauseTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // When pausing, record the current active time
    if (timerState === TimerState.RUNNING) {
      const now = Date.now();
      const elapsed = now - lastTimestampRef.current;
      activeTimeRef.current += elapsed;
      pauseTimeRef.current = now;
      console.log(`Timer paused. Active time so far: ${Math.round(activeTimeRef.current / 60000)} minutes`);
    }
    
    setTimerState(TimerState.PAUSED);
    saveTimerState();
  }, [timerState, saveTimerState]);
  
  const resumeTimer = useCallback(() => {
    startTimerInternal();
  }, [startTimerInternal]);
  
  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Reset the time based on current timer type
    let newTimeLeft = (settings?.pomodoro_duration || DEFAULT_POMODORO_DURATION) * 60;
    if (timerType === TimerType.SHORT_BREAK) {
      newTimeLeft = (settings?.short_break_duration || 5) * 60;
    } else if (timerType === TimerType.LONG_BREAK) {
      newTimeLeft = (settings?.long_break_duration || 15) * 60;
    }
    
    setTimeLeft(newTimeLeft);
    setTimerState(TimerState.IDLE);
    saveTimerState();
  }, [timerType, settings, saveTimerState]);
  
  const skipTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    let newTimerType: TimerType;
    let newTimeLeft: number;
    
    if (timerType === TimerType.POMODORO) {
      // If in pomodoro, skip to appropriate break
      if ((completedPomodoros + 1) % (settings?.pomodoros_until_long_break || 4) === 0) {
        newTimerType = TimerType.LONG_BREAK;
        newTimeLeft = (settings?.long_break_duration || 15) * 60;
      } else {
        newTimerType = TimerType.SHORT_BREAK;
        newTimeLeft = (settings?.short_break_duration || 5) * 60;
      }
    } else {
      // If in break, skip to pomodoro
      newTimerType = TimerType.POMODORO;
      newTimeLeft = (settings?.pomodoro_duration || DEFAULT_POMODORO_DURATION) * 60;
    }
    
    setTimerType(newTimerType);
    setTimeLeft(newTimeLeft);
    setTimerState(TimerState.IDLE);
    saveTimerState();
  }, [timerType, completedPomodoros, settings, saveTimerState]);
  
  // Format seconds to MM:SS
  const formatTime = useCallback((seconds: number): string => {
    if (!seconds || isNaN(seconds)) {
      return '25:00'; // Default display if seconds is invalid
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);
  
  // Update current task
  const updateCurrentTask = useCallback((task: string) => {
    setCurrentTask(task);
    saveTimerState();
  }, [saveTimerState]);
  
  // Update todo items
  const updateTodoItems = useCallback((todos: Todo[]) => {
    setTodoItems(todos);
    saveTimerState();
  }, [saveTimerState]);
  
  const value = {
    timeLeft,
    timerState,
    timerType,
    completedPomodoros,
    currentTask,
    todoItems,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipTimer,
    formatTime,
    setCurrentTask: updateCurrentTask,
    updateTodoItems
  };
  
  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}; 