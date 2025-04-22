import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStats } from '../../contexts/StatsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import SettingsModal from '../settings/SettingsModal';
import TodoList, { Todo } from './TodoList';
import toast from 'react-hot-toast';

// Timer states
enum TimerState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  POMODORO = 'pomodoro',
  SHORT_BREAK = 'short_break',
  LONG_BREAK = 'long_break',
}

// Timer types
enum TimerType {
  POMODORO = 'pomodoro',
  SHORT_BREAK = 'short_break',
  LONG_BREAK = 'long_break',
}

interface PomodoroTimerProps {}

const PomodoroTimer: React.FC<PomodoroTimerProps> = () => {
  const { addSession, refreshStats } = useStats();
  const { isAuthenticated } = useAuth();
  const { settings, updateSettings } = useSettings();
  
  const [timeLeft, setTimeLeft] = useState<number>(settings.pomodoro_duration * 60);
  const [timerState, setTimerState] = useState<TimerState>(TimerState.IDLE);
  const [timerType, setTimerType] = useState<TimerType>(TimerType.POMODORO);
  const [completedPomodoros, setCompletedPomodoros] = useState<number>(0);
  const [task, setTask] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTodoListOpen, setIsTodoListOpen] = useState<boolean>(false);
  const [todoItems, setTodoItems] = useState<Todo[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Set the task from the todo list
  const handleTaskSelect = (selectedTask: string) => {
    console.log('Task selected:', selectedTask);
    setTask(selectedTask);
  };

  // Load todo items from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('pomodoro-todos');
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos);
        console.log('Loaded todos from localStorage:', parsedTodos);
        setTodoItems(parsedTodos);
        // Automatically select first incomplete task if none is selected
        if (!task && parsedTodos.length > 0) {
          const firstIncompleteTodo = parsedTodos.find((todo: Todo) => !todo.completed);
          if (firstIncompleteTodo) {
            console.log('Auto-selecting first incomplete todo:', firstIncompleteTodo);
            setTask(firstIncompleteTodo.text);
          }
        }
      } catch (e) {
        console.error('Error parsing saved todos', e);
      }
    }
  }, [task]);

  // Keep todoItems in sync with localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedTodos = localStorage.getItem('pomodoro-todos');
      if (savedTodos) {
        try {
          setTodoItems(JSON.parse(savedTodos));
        } catch (e) {
          console.error('Error parsing saved todos from storage event', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Set the initial timer based on the timer type
  useEffect(() => {
    if (!settings) return;
    
    let duration = 0;
    if (timerType === TimerType.POMODORO) {
      duration = settings.pomodoro_duration * 60;
    } else if (timerType === TimerType.SHORT_BREAK) {
      duration = settings.short_break_duration * 60;
    } else if (timerType === TimerType.LONG_BREAK) {
      duration = settings.long_break_duration * 60;
    }
    
    setTimeLeft(duration);
  }, [timerType, settings]);

  // Save todos to localStorage when they change
  const saveTodosToLocalStorage = (todos: Todo[]) => {
    localStorage.setItem('pomodoro-todos', JSON.stringify(todos));
    setTodoItems(todos);
  };

  // Records completed tasks from the todo list
  const recordCompletedTasks = useCallback(async () => {
    // Add a debug toast to show that the function is being called
    console.log("Recording completed task...");
    toast.success("Pomodoro completed! Recording session...");
    
    // Only proceed if user is authenticated
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping stats recording');
      toast.error('Please log in to track your sessions');
      return;
    }

    try {
      // Get all completed todo items
      const completedTodos = todoItems.filter(todo => todo.completed);
      console.log('Completed todos:', completedTodos);
      
      // If we have a current task, record it directly
      if (task && task.trim()) {
        console.log('Current task found:', task);
        
        // Find and mark current task as completed in the todo list
        const updatedTodos = todoItems.map(todo => 
          todo.text === task ? { ...todo, completed: true, recordedInStats: true } : todo
        );
        saveTodosToLocalStorage(updatedTodos);
      }
        
      try {
        // Prepare task description - use completed todos or current task
        let taskDescription = "Completed Pomodoro";
        
        if (completedTodos.length > 0) {
          // Use completed todo texts
          taskDescription = completedTodos.map(todo => todo.text).join(", ");
          console.log('Using completed todos as task description:', taskDescription);
        } else if (task && task.trim()) {
          // Use current task as fallback
          taskDescription = task;
          console.log('Using current task as description:', taskDescription);
        }
        
        // Record the session with task description
        console.log('Recording session with task:', taskDescription);
        
        // Calculate actual duration based on elapsed time
        const endTime = Date.now();
        const startTime = startTimeRef.current;
        const elapsedMinutes = Math.round((endTime - startTime) / 60000); // Convert ms to minutes
        
        // Use actual elapsed time, fallback to settings duration if something went wrong
        const actualDuration = startTime > 0 ? elapsedMinutes : settings.pomodoro_duration;
        
        console.log(`Recording session with actual duration: ${actualDuration} minutes (from ${startTime} to ${endTime})`);
        
        await addSession({
          duration: actualDuration,
          task: taskDescription,
          completed: true,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString()
        });
        
        console.log('Pomodoro session successfully recorded with task:', taskDescription);
        toast.success('Session recorded!');
        
        // Force refresh stats after adding a session
        await refreshStats();
        return;
      } catch (error: unknown) {
        console.error('Failed to save pomodoro session:', error);
        if (error instanceof Error || (typeof error === 'object' && error !== null)) {
          const errorStr = String(error);
          if (errorStr.includes('401')) {
            toast.error('Please log in to track your sessions');
          } else {
            toast.error('Failed to save session');
          }
        } else {
          toast.error('Failed to save session');
        }
      }
    } catch (error) {
      console.error('Error in recordCompletedTasks:', error);
      toast.error('Failed to record session');
    }
  }, [task, todoItems, isAuthenticated, addSession, refreshStats, settings.pomodoro_duration]);

  // Request notification permission when component mounts
  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window && settings.notification_enabled) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        // Request permission
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            toast.success('Notifications enabled!');
          } else {
            toast.error('Notifications permission denied. You can enable them in your browser settings.');
          }
        });
      }
    }
  }, [settings.notification_enabled]);

  // Handle timer completion
  useEffect(() => {
    if (timeLeft <= 0 && timerState === TimerState.RUNNING) {
      clearInterval(intervalRef.current!);
      
      // If a pomodoro was completed
      if (timerType === TimerType.POMODORO) {
        setCompletedPomodoros(prev => prev + 1);
        
        // Record completed tasks in stats
        recordCompletedTasks();
        
        // Determine which break to take
        const newCompletedPomodoros = completedPomodoros + 1;
        if (newCompletedPomodoros % settings.pomodoros_until_long_break === 0) {
          setTimerType(TimerType.LONG_BREAK);
        } else {
          setTimerType(TimerType.SHORT_BREAK);
        }

        // Auto start breaks if enabled
        if (settings.auto_start_breaks) {
          setTimeout(() => startTimer(), 1000);
        }
      } else {
        // After a break, go back to pomodoro
        setTimerType(TimerType.POMODORO);
        
        // Auto start pomodoros if enabled
        if (settings.auto_start_pomodoros) {
          setTimeout(() => startTimer(), 1000);
        }
      }
      
      setTimerState(TimerState.COMPLETED);
      
      // Play a sound to indicate completion if enabled
      if (settings.sound_enabled) {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(error => console.error('Error playing notification sound:', error));
      }
      
      // Show browser notification if supported and enabled
      if (settings.notification_enabled && 'Notification' in window) {
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
  }, [timeLeft, timerState, timerType, completedPomodoros, task, addSession, isAuthenticated, refreshStats, settings, recordCompletedTasks]);

  // Start the timer
  const startTimer = () => {
    setTimerState(TimerState.RUNNING);
    startTimeRef.current = Date.now();
    
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Pause the timer
  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimerState(TimerState.PAUSED);
  };

  // Resume the timer
  const resumeTimer = () => {
    startTimer();
  };

  // Reset the timer
  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Reset the time based on current timer type
    switch (timerType) {
      case TimerType.POMODORO:
        setTimeLeft(settings.pomodoro_duration * 60);
        break;
      case TimerType.SHORT_BREAK:
        setTimeLeft(settings.short_break_duration * 60);
        break;
      case TimerType.LONG_BREAK:
        setTimeLeft(settings.long_break_duration * 60);
        break;
    }
    
    setTimerState(TimerState.IDLE);
  };

  // Skip to the next timer
  const skipTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (timerType === TimerType.POMODORO) {
      // If in pomodoro, skip to appropriate break
      if ((completedPomodoros + 1) % settings.pomodoros_until_long_break === 0) {
        setTimerType(TimerType.LONG_BREAK);
      } else {
        setTimerType(TimerType.SHORT_BREAK);
      }
    } else {
      // If in break, skip to pomodoro
      setTimerType(TimerType.POMODORO);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle settings update
  const handleSettingsUpdate = async (newSettings: any) => {
    console.log('Settings update requested with:', newSettings);
    try {
      // Make sure we have the updateSettings function
      if (!updateSettings) {
        console.error('updateSettings function is not available');
        toast.error('Could not update settings: function not available');
        return;
      }
      
      // Add logging before the API call
      console.log('Calling updateSettings with:', newSettings);
      console.log('Current settings before update:', settings);
      
      // Try to update the settings
      await updateSettings(newSettings);
      
      // Add logging after the API call
      console.log('Settings updated successfully');
      console.log('New settings after update:', settings);
      
      toast.success('Settings updated');
    } catch (error) {
      console.error('Error updating settings:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        toast.error(`Failed to update settings: ${error.message}`);
      } else {
        toast.error('Failed to update settings: Unknown error');
      }
    }
  };

  return (
    <div className="flex flex-col items-center p-6 backdrop-blur-sm bg-white/30 rounded-lg shadow-lg w-full max-w-md">
      <div className="w-full flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setTimerType(TimerType.POMODORO)}
            className={`px-3 py-1.5 rounded-md text-sm ${
              timerType === TimerType.POMODORO
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800/40 text-white hover:bg-gray-700/50'
            }`}
          >
            Pomodoro
          </button>
          <button
            onClick={() => setTimerType(TimerType.SHORT_BREAK)}
            className={`px-3 py-1.5 rounded-md text-sm ${
              timerType === TimerType.SHORT_BREAK
                ? 'bg-green-600 text-white'
                : 'bg-gray-800/40 text-white hover:bg-gray-700/50'
            }`}
          >
            Short Break
          </button>
          <button
            onClick={() => setTimerType(TimerType.LONG_BREAK)}
            className={`px-3 py-1.5 rounded-md text-sm ${
              timerType === TimerType.LONG_BREAK
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800/40 text-white hover:bg-gray-700/50'
            }`}
          >
            Long Break
          </button>
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="text-white hover:text-indigo-200 p-1 focus:outline-none"
          aria-label="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <div className="text-7xl font-bold my-8 text-white drop-shadow-lg">{formatTime(timeLeft)}</div>

      <div className="w-full mb-6 relative">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onClick={() => setIsTodoListOpen(true)}
          placeholder="What are you working on?"
          className="w-full px-4 py-2 border border-gray-300 bg-black/20 text-white placeholder-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          readOnly // Make it read-only so clicking opens the task list instead of typing
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-300">
          <button 
            onClick={() => setIsTodoListOpen(true)} 
            className="hover:text-white focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        {timerState === TimerState.IDLE && (
          <button
            onClick={startTimer}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Start
          </button>
        )}
        {timerState === TimerState.RUNNING && (
          <button
            onClick={pauseTimer}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            Pause
          </button>
        )}
        {timerState === TimerState.PAUSED && (
          <button
            onClick={resumeTimer}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Resume
          </button>
        )}
        {timerState !== TimerState.IDLE && (
          <button
            onClick={resetTimer}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset
          </button>
        )}
        <button
          onClick={skipTimer}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          Skip
        </button>
      </div>

      <div className="text-sm text-white">
        Completed pomodoros: {completedPomodoros}
      </div>

      {isSettingsOpen && (
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSettingsUpdate}
          initialSettings={settings}
        />
      )}

      <TodoList 
        isOpen={isTodoListOpen} 
        onClose={() => setIsTodoListOpen(false)} 
        onTaskSelect={handleTaskSelect}
        currentTask={task}
        initialTodos={todoItems}
        onTodosChange={(updatedTodos) => saveTodosToLocalStorage(updatedTodos)}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
};

export default PomodoroTimer; 