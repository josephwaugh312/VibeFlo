import React from 'react';
import { useTimer, TimerState, TimerType } from '../../contexts/TimerContext';
import { Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const MiniTimer: React.FC = () => {
  const {
    timeLeft,
    timerState,
    timerType,
    formatTime,
    pauseTimer,
    resumeTimer
  } = useTimer();
  
  const navigate = useNavigate();
  
  // Determine color based on timer type
  const getTimerColor = () => {
    if (timerState === TimerState.PAUSED) return 'text-yellow-500';
    
    switch (timerType) {
      case TimerType.POMODORO:
        return 'text-red-500';
      case TimerType.SHORT_BREAK:
        return 'text-green-500';
      case TimerType.LONG_BREAK:
        return 'text-blue-500';
      default:
        return 'text-white';
    }
  };
  
  // Don't show if timer is idle and on dashboard page
  if (timerState === TimerState.IDLE) {
    return null;
  }
  
  const timerTypeLabel = timerType === TimerType.POMODORO 
    ? 'Pomodoro' 
    : timerType === TimerType.SHORT_BREAK 
      ? 'Short Break' 
      : 'Long Break';
  
  const handleClick = () => {
    navigate('/dashboard');
  };
  
  const handleTimerToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (timerState === TimerState.RUNNING) {
      pauseTimer();
    } else if (timerState === TimerState.PAUSED) {
      resumeTimer();
    }
  };

  return (
    <Tooltip title={`${timerTypeLabel} (Click to go to timer page)`}>
      <div 
        className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-800/80 cursor-pointer hover:bg-gray-700/80 transition-colors"
        onClick={handleClick}
      >
        <div className={`font-mono font-bold ${getTimerColor()}`}>
          {formatTime(timeLeft)}
        </div>
        
        <button 
          onClick={handleTimerToggle}
          className="focus:outline-none"
        >
          {timerState === TimerState.RUNNING ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
    </Tooltip>
  );
};

export default MiniTimer; 