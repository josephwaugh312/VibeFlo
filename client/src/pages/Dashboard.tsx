import React, { useEffect } from 'react';
import PomodoroTimer from '../components/pomodoro/PomodoroTimer';
import { useAuth } from '../contexts/AuthContext';
import { useStats } from '../contexts/StatsContext';
import { Link } from 'react-router-dom';
import { Typography, Paper } from '@mui/material';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { sessions, loading, error, refreshStats } = useStats();
  
  // Get the 5 most recent sessions, safely handling null/undefined
  const recentSessions = sessions?.slice(0, 5) || [];

  // Add debugging to check if Dashboard is rendering
  useEffect(() => {
    console.log("Dashboard rendered with:", {
      userExists: !!user,
      username: user?.username,
      sessionsCount: sessions?.length || 0
    });
    
    // Refresh stats when the dashboard loads
    refreshStats();
  }, [user, refreshStats, sessions?.length]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-6">Welcome, @{user?.username || 'User'}!</h1>

      {/* User Bio Quote Display */}
      {user?.bio && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 5, 
            bgcolor: 'rgba(30, 30, 30, 0.7)', 
            borderRadius: 2,
            borderLeft: '4px solid',
            borderColor: 'primary.main',
          }}
        >
          <Typography 
            variant="h4" 
            component="p" 
            sx={{ 
              fontStyle: 'italic', 
              fontWeight: 700,
              color: 'white',
              textShadow: '1px 1px 3px rgba(0,0,0,0.3)',
              fontFamily: '"Playfair Display", "Georgia", serif',
              letterSpacing: '0.02em',
              wordBreak: 'break-word', 
              overflowWrap: 'break-word',
              hyphens: 'auto',
              lineHeight: 1.3,
              textAlign: 'center',
              px: 2
            }}
          >
            {user.bio}
          </Typography>
        </Paper>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-white drop-shadow-md mb-4">Pomodoro Timer</h2>
          <PomodoroTimer />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white drop-shadow-md">Recent Sessions</h2>
          </div>
          <div className="bg-gray-800 bg-opacity-80 rounded-lg shadow-lg p-4">
            {loading ? (
              <div className="p-4 flex justify-center items-center min-h-[200px]">
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded"></div>
                      <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="p-4 text-red-400 min-h-[100px] flex items-center justify-center">
                <p>{error}</p>
              </div>
            ) : recentSessions.length === 0 ? (
              <div className="p-4 text-white/70 min-h-[100px] flex flex-col items-center justify-center space-y-2">
                <p>No sessions recorded yet.</p>
                <p className="text-sm">Complete a Pomodoro session to see it here!</p>
              </div>
            ) : (
              <ul className="space-y-3 min-h-[200px]">
                {recentSessions.map((session, index) => (
                  <li 
                    key={session.id || `temp-session-${index}`} 
                    className={`bg-gray-700 bg-opacity-80 rounded p-3 flex justify-between items-center ${
                      session.id === -1 ? 'border border-yellow-500 border-opacity-50' : ''
                    }`}
                  >
                    <div>
                      <h3 className="text-white font-medium">
                        {session.task || 'Untitled Session'}
                        {session.potentiallyUnsaved && 
                          <span className="ml-2 text-yellow-500 text-xs">(saving...)</span>
                        }
                      </h3>
                      <p className="text-white/70 text-sm">{new Date(session.created_at).toLocaleDateString()} {new Date(session.created_at).toLocaleTimeString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        session.completed 
                          ? 'bg-green-700 text-green-100' 
                          : 'bg-yellow-700 text-yellow-100'
                      }`}>
                        {session.completed ? 'Completed' : 'In Progress'}
                      </span>
                      <p className="text-white/70 text-sm mt-1">{session.duration} minutes</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            <div className="mt-4 text-center">
              <Link 
                to="/stats" 
                className="text-purple-300 hover:text-white text-sm font-medium transition-colors duration-300"
              >
                View all sessions →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 