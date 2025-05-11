import React, { useState, useEffect } from 'react';
import { useStats } from '../../contexts/StatsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import SettingsModal from '../settings/SettingsModal';
import TodoList, { Todo } from './TodoList';
import toast from 'react-hot-toast';
import { useTimer, TimerState, TimerType } from '../../contexts/TimerContext';

interface PomodoroTimerProps {}

const PomodoroTimer: React.FC<PomodoroTimerProps> = () => {
  const { settings, updateSettings } = useSettings();
  const { isAuthenticated } = useAuth();
  
  // Use global timer context instead of local state
  const {
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
    setCurrentTask,
    updateTodoItems
  } = useTimer();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTodoListOpen, setIsTodoListOpen] = useState<boolean>(false);

  // Set the task from the todo list
  const handleTaskSelect = (selectedTask: string) => {
    console.log('Task selected:', selectedTask);
    setCurrentTask(selectedTask);
  };

  // Load todo items from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('pomodoro-todos');
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos);
        console.log('Loaded todos from localStorage:', parsedTodos);
        updateTodoItems(parsedTodos);
        // Automatically select first incomplete task if none is selected
        if (!currentTask && parsedTodos.length > 0) {
          const firstIncompleteTodo = parsedTodos.find((todo: Todo) => !todo.completed);
          if (firstIncompleteTodo) {
            console.log('Auto-selecting first incomplete todo:', firstIncompleteTodo);
            setCurrentTask(firstIncompleteTodo.text);
          }
        }
      } catch (e) {
        console.error('Error parsing saved todos', e);
      }
    }
  }, [currentTask]);

  // Save todos to localStorage when they change
  const saveTodosToLocalStorage = (todos: Todo[]) => {
    localStorage.setItem('pomodoro-todos', JSON.stringify(todos));
    updateTodoItems(todos);
  };

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
        <div className="flex space-x-2 flex-grow overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => {
              resetTimer();
              timerType !== TimerType.POMODORO && skipTimer();
            }}
            className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${
              timerType === TimerType.POMODORO
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800/40 text-white hover:bg-gray-700/50'
            }`}
          >
            Pomodoro
          </button>
          <button 
            onClick={() => {
              resetTimer();
              timerType !== TimerType.SHORT_BREAK && skipTimer();
            }}
            className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${
              timerType === TimerType.SHORT_BREAK
                ? 'bg-green-600 text-white'
                : 'bg-gray-800/40 text-white hover:bg-gray-700/50'
            }`}
          >
            Short Break
          </button>
          <button 
            onClick={() => {
              resetTimer();
              timerType !== TimerType.LONG_BREAK && skipTimer(); 
            }}
            className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${
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
          className="text-white hover:text-indigo-200 p-1 focus:outline-none ml-3"
          aria-label="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Add CSS to handle scrollbar hiding */}
      <style>{`
        @media (max-width: 425px) {
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
          }
        }
      `}</style>

      <div className="text-7xl font-bold my-8 text-white drop-shadow-lg" data-cy="timer-display">{formatTime(timeLeft)}</div>

      <div className="w-full mb-6 relative">
        <input
          type="text"
          value={currentTask}
          onChange={(e) => setCurrentTask(e.target.value)}
          onClick={() => setIsTodoListOpen(true)}
          placeholder="What are you working on?"
          className="w-full px-4 py-2 border border-gray-300 bg-black/20 text-white placeholder-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          readOnly // Make it read-only so clicking opens the task list instead of typing
        />
        <button 
          onClick={() => setIsTodoListOpen(true)} 
          className="absolute right-2 top-[35%] transform -translate-y-1/2 p-1 text-purple-400 hover:text-white focus:outline-none"
          aria-label="Edit tasks"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
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
      
      {isTodoListOpen && (
        <TodoList 
          isOpen={isTodoListOpen} 
          onClose={() => setIsTodoListOpen(false)}
          todos={todoItems}
          onTaskSelect={handleTaskSelect}
          onSave={saveTodosToLocalStorage}
          currentTask={currentTask}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  );
};

export default PomodoroTimer; 