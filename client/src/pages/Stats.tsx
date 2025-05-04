import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStats } from '../contexts/StatsContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, BarChart, Bar
} from 'recharts';

// Define tab types
type TabType = 'overview' | 'trends' | 'details';
// Define time range types
type TimeRangeType = '7days' | '30days' | 'all';

// Define chart data structure
interface ChartDataItem {
  day: string;
  fullDay: string;
  dayIndex: number;
  sessions: number;
  focusMinutes: number;
  dummy: boolean;
  dateString?: string;
}

// Define performance metrics structure
interface PerformanceMetrics {
  currentStreak: number;
  longestSession: number;
  mostProductiveDay: {
    day: string;
    minutes: number;
  };
  completionRate: number;
}

// Define activity data structure
interface ActivityData {
  count: number;
  totalMinutes: number;
}

const Stats: React.FC = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  // State for selected time range
  const [timeRange, setTimeRange] = useState<TimeRangeType>('7days');
  const { stats, sessions, loading, error, refreshStats } = useStats();
  
  // Track if component is mounted
  const isMounted = useRef(true);
  
  // Fetch stats when component mounts
  useEffect(() => {
    console.log('Stats component mounted, refreshing data...');
    refreshStats();
    
    return () => {
      isMounted.current = false;
    };
  }, [refreshStats]);
  
  // Add effect to refresh data when time range changes
  useEffect(() => {
    // This ensures the component re-renders when timeRange changes
    console.log(`Time range changed to: ${timeRange}`);
  }, [timeRange]);

  const formatDuration = (minutes: number = 0): string => {
    if (!minutes && minutes !== 0) return '0 minutes';
    
    // For the total focus time on stats, just display rounded minutes
    const roundedMinutes = Math.round(minutes);
    
    const hours = Math.floor(roundedMinutes / 60);
    const mins = roundedMinutes % 60;
    
    if (hours === 0) {
      return `${mins} minute${mins !== 1 ? 's' : ''}`;
    } else if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  useEffect(() => {
    // Log stats data for debugging
    if (stats) {
      console.log("Stats data received:", stats);
      console.log("Last Week Activity:", stats.lastWeekActivity);
      console.log("Sessions data:", sessions?.length || 0);
    }
  }, [stats, sessions]);

  // Prepare data for charts based on selected time range
  const prepareSessionData = useCallback((): ChartDataItem[] => {
    if (!stats && (!sessions || sessions.length === 0)) {
      // Return placeholder data when no stats or sessions exist
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
      
      return [{
        day: days[today],
        fullDay: days[today],
        dayIndex: today,
        sessions: 0,
        focusMinutes: 0,
        dummy: true
      }];
    }
    
    console.log("Preparing session data for time range:", timeRange);
    
    // If using sessions data directly
    if (sessions && sessions.length > 0) {
      console.log("Using sessions data to create chart data");
      
      // Filter sessions based on time range
      const now = new Date();
      let filterDate = new Date();
      
      if (timeRange === '7days') {
        filterDate.setDate(now.getDate() - 7);
      } else if (timeRange === '30days') {
        filterDate.setDate(now.getDate() - 30);
      } else {
        // All time - set to a very old date
        filterDate = new Date(2000, 0, 1);
      }
      
      const filteredSessions = timeRange === 'all' 
        ? sessions 
        : sessions.filter(session => new Date(session.created_at) >= filterDate);
      
      console.log(`Filtered sessions for ${timeRange}:`, filteredSessions.length);
      
      // Group sessions by day
      const sessionsByDay = filteredSessions.reduce((acc, session) => {
        // Convert session date to day name
        const date = new Date(session.created_at);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const shortDayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        // Map day names to their numeric index for sorting
        const dayIndices = {
          'Sunday': 0,
          'Monday': 1,
          'Tuesday': 2,
          'Wednesday': 3,
          'Thursday': 4,
          'Friday': 5,
          'Saturday': 6
        };
        
        if (!acc[dayName]) {
          acc[dayName] = {
            day: shortDayName,
            fullDay: dayName,
            dayIndex: dayIndices[dayName as keyof typeof dayIndices],
            sessions: 0,
            focusMinutes: 0,
            dummy: false,
            dateString: date.toISOString().split('T')[0] // For debugging
          };
        }
        
        acc[dayName].sessions += 1;
        acc[dayName].focusMinutes += session.duration || 0;
        
        return acc;
      }, {} as Record<string, ChartDataItem>);
      
      // Convert to array and sort by day of week for consistent display
      let chartData = Object.values(sessionsByDay).sort((a, b) => a.dayIndex - b.dayIndex);
      
      // If there's no data, add a placeholder
      if (chartData.length === 0) {
        const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        chartData.push({
          day: days[today],
          fullDay: fullDays[today],
          dayIndex: today,
          sessions: 0,
          focusMinutes: 0,
          dummy: true
        });
      }
      
      return chartData;
    }
    
    // If using activity data from stats
    // Choose the appropriate activity data based on timeRange
    let activityData;
    if (timeRange === '7days') {
      activityData = stats?.lastWeekActivity || {};
    } else if (timeRange === '30days') {
      activityData = stats?.last30DaysActivity || {};
    } else {
      activityData = stats?.allTimeActivity || {};
    }
    
    // If no activity data for the selected range, return placeholder
    if (!activityData || Object.keys(activityData).length === 0) {
      const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      return [{
        day: days[today],
        fullDay: fullDays[today],
        dayIndex: today,
        sessions: 0,
        focusMinutes: 0,
        dummy: true
      }];
    }
    
    // Convert the activity data to an array for charts
    // We need to map day names to their numeric index for sorting
    const dayIndices = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6
    };
    
    const chartData = Object.entries(activityData).map(([day, data]) => ({
      day: day.substring(0, 3), // Use first 3 letters of day name for chart labels
      fullDay: day, // Store full day name for sorting
      dayIndex: dayIndices[day as keyof typeof dayIndices],
      sessions: data.count || 0,
      focusMinutes: data.totalMinutes || 0,
      dummy: false
    }));
    
    // Sort by day of week (Sunday to Saturday)
    const sortedChartData = [...chartData].sort((a, b) => a.dayIndex - b.dayIndex);
    
    return sortedChartData;
  }, [timeRange, stats, sessions]);

  // Calculate performance metrics
  const calculatePerformanceMetrics = (): PerformanceMetrics => {
    if (!sessions || sessions.length === 0) {
      console.log("No sessions available for performance metrics");
      return {
        currentStreak: 0,
        longestSession: 0,
        mostProductiveDay: {
          day: 'N/A',
          minutes: 0
        },
        completionRate: 0
      };
    }

    console.log("Calculating performance metrics from", sessions.length, "sessions");

    // Sort sessions by date (most recent first)
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    // Calculate current streak (consecutive days with completed sessions)
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    
    let checkDate = new Date(today);
    let streakBroken = false;
    
    // Create a set of dates with completed sessions for faster lookups
    const datesWithCompletedSessions = new Set();
    sortedSessions.forEach(session => {
      if (session.completed) {
        const sessionDate = new Date(session.created_at);
        sessionDate.setHours(0, 0, 0, 0); // Normalize to start of day
        datesWithCompletedSessions.add(sessionDate.toISOString().split('T')[0]);
      }
    });
    
    console.log("Dates with completed sessions:", Array.from(datesWithCompletedSessions));
    
    while (!streakBroken) {
      // Format the date to YYYY-MM-DD for comparison
      const dateString = checkDate.toISOString().split('T')[0];
      
      if (datesWithCompletedSessions.has(dateString)) {
        currentStreak++;
        console.log(`Found completed session on ${dateString}, streak: ${currentStreak}`);
        // Move to previous day
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        console.log(`No completed session on ${dateString}, streak ends at ${currentStreak}`);
        streakBroken = true;
      }
    }
    
    // Find longest session
    const longestSession = sortedSessions.reduce((max, session) => 
      session.duration > max ? session.duration : max, 0
    );
    console.log("Longest session duration:", longestSession, "minutes");
    
    // Group sessions by day of week to find most productive day
    const sessionsByDay = sortedSessions.reduce((acc, session) => {
      const date = new Date(session.created_at);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (!acc[dayName]) {
        acc[dayName] = 0;
      }
      
      acc[dayName] += session.duration || 0;
      
      return acc;
    }, {} as Record<string, number>);
    
    let mostProductiveDay = { day: 'N/A', minutes: 0 };
    
    Object.entries(sessionsByDay).forEach(([day, minutes]) => {
      if (minutes > mostProductiveDay.minutes) {
        mostProductiveDay = { day, minutes };
      }
    });
    
    console.log("Most productive day:", mostProductiveDay);
    
    // Calculate completion rate
    const completedSessions = sortedSessions.filter(session => session.completed).length;
    const completionRate = Math.round((completedSessions / sortedSessions.length) * 100);
    console.log(`Completion rate: ${completionRate}% (${completedSessions}/${sortedSessions.length})`);
    
    return {
      currentStreak,
      longestSession,
      mostProductiveDay,
      completionRate
    };
  };

  // Render tab buttons without refresh controls
  const renderTabButtons = () => (
    <div className="flex flex-col sm:flex-row justify-between border-b border-white/20 mb-6">
      <div className="flex overflow-x-auto space-x-6">
        <button
          className={`py-2 px-4 font-medium text-sm rounded transition-all duration-200 ease-in-out ${
            activeTab === 'overview' 
              ? 'bg-purple-600 text-white' 
              : 'text-white/70 hover:text-white'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm rounded transition-all duration-200 ease-in-out ${
            activeTab === 'trends' 
              ? 'bg-purple-600 text-white' 
              : 'text-white/70 hover:text-white'
          }`}
          onClick={() => setActiveTab('trends')}
        >
          Trends
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm rounded transition-all duration-200 ease-in-out ${
            activeTab === 'details' 
              ? 'bg-purple-600 text-white' 
              : 'text-white/70 hover:text-white'
          }`}
          onClick={() => setActiveTab('details')}
        >
          Session History
        </button>
      </div>
    </div>
  );

  // Render weekly activity table
  const renderWeeklyActivityTable = () => {
    console.log("Rendering weekly activity table with stats:", stats);
    
    if (!stats) {
      return (
        <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-white drop-shadow-md mb-4">Weekly Activity</h2>
          <p className="text-white text-center py-4">Loading your activity data...</p>
        </div>
      );
    }
    
    // If sessions data is available but lastWeekActivity is not, use sessions to create the table
    if ((!stats.lastWeekActivity || Object.keys(stats.lastWeekActivity || {}).length === 0) && sessions && sessions.length > 0) {
      console.log("Using sessions data to create weekly activity table");
      
      // Group sessions by day for last 7 days
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Filter sessions for last 7 days
      const recentSessions = sessions.filter(session => new Date(session.created_at) >= sevenDaysAgo);
      
      if (recentSessions.length === 0) {
        return (
          <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold text-white drop-shadow-md mb-4">Weekly Activity</h2>
            <p className="text-white text-center py-4">No activity data available for this week yet.</p>
          </div>
        );
      }
      
      // Group by day
      const sessionsByDay = recentSessions.reduce((acc, session) => {
        const date = new Date(session.created_at);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }); // Full day name
        
        if (!acc[dayName]) {
          acc[dayName] = {
            count: 0,
            totalMinutes: 0
          };
        }
        
        acc[dayName].count += 1;
        acc[dayName].totalMinutes += session.duration;
        
        return acc;
      }, {} as Record<string, ActivityData>);
      
      return (
        <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-white drop-shadow-md mb-4">Weekly Activity</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Day</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Sessions</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Focus Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(sessionsByDay).map(([day, data]) => (
                  <tr key={day}>
                    <td className="px-4 py-3 text-sm text-white">{day}</td>
                    <td className="px-4 py-3 text-sm text-white">{data.count}</td>
                    <td className="px-4 py-3 text-sm text-white">{formatDuration(data.totalMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    
    // If lastWeekActivity is available, use it
    if (stats.lastWeekActivity && Object.keys(stats.lastWeekActivity).length > 0) {
      console.log("Using lastWeekActivity data to create weekly activity table");
      
      return (
        <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-white drop-shadow-md mb-4">Weekly Activity</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Day</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Sessions</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Focus Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(stats.lastWeekActivity).map(([day, data]) => (
                  <tr key={day}>
                    <td className="px-4 py-3 text-sm text-white">{day}</td>
                    <td className="px-4 py-3 text-sm text-white">{data.count}</td>
                    <td className="px-4 py-3 text-sm text-white">{formatDuration(data.totalMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    
    // No activity data available
    return (
      <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-white drop-shadow-md mb-4">Weekly Activity</h2>
        <p className="text-white text-center py-4">No activity data available for this week yet.</p>
      </div>
    );
  };

  // Render overview tab content
  const renderOverviewTab = () => {
    const metrics = calculatePerformanceMetrics();
    
    return (
      <>
        {stats && (
          <div className="flex flex-wrap justify-center gap-10 mb-8">
            <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg text-center w-72 h-72 flex flex-col items-center justify-center">
              <h2 className="text-xl font-semibold text-white drop-shadow-md mb-4">Total Sessions</h2>
              <p className="text-6xl font-bold text-white mb-4">{stats.totalSessions}</p>
              <div className="mt-4 text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            
            <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg text-center w-72 h-72 flex flex-col items-center justify-center">
              <h2 className="text-xl font-semibold text-white drop-shadow-md mb-4">Completed Sessions</h2>
              <p className="text-6xl font-bold text-white mb-4">{stats.completedSessions}</p>
              <p className="text-sm text-white/90 mt-2">
                {stats.totalSessions > 0 
                  ? `${Math.round((stats.completedSessions / stats.totalSessions) * 100)}% completion rate` 
                  : 'No sessions yet'}
              </p>
              <div className="mt-4 text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg text-center w-72 h-72 flex flex-col items-center justify-center">
              <h2 className="text-xl font-semibold text-white drop-shadow-md mb-4">Total Focus Time</h2>
              <p className="text-5xl font-bold text-white mb-4">{formatDuration(stats.totalFocusTime)}</p>
              <div className="mt-4 text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}
        
        {/* Completion Trend Section */}
        {stats && stats.completionTrend && (
          <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold text-white drop-shadow-md mb-4">Weekly Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 bg-opacity-80 p-4 rounded-lg">
                <h3 className="text-md font-medium text-white mb-1">This Week</h3>
                <p className="text-2xl font-bold text-white">{stats.completionTrend.currentWeek} sessions</p>
                <p className="text-xs text-white/70 mt-1">Completed sessions this week</p>
              </div>
              
              <div className="bg-gray-700 bg-opacity-80 p-4 rounded-lg">
                <h3 className="text-md font-medium text-white mb-1">Last Week</h3>
                <p className="text-2xl font-bold text-white">{stats.completionTrend.previousWeek} sessions</p>
                <p className="text-xs text-white/70 mt-1">Completed sessions last week</p>
              </div>
              
              <div className="bg-gray-700 bg-opacity-80 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-md font-medium text-white">Weekly Change</h3>
                  <span className={`text-sm font-bold ${stats.completionTrend.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.completionTrend.percentChange >= 0 ? '↑' : '↓'} {Math.abs(stats.completionTrend.percentChange)}%
                  </span>
                </div>
                <div className="h-6 bg-gray-600 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${stats.completionTrend.percentChange >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs(stats.completionTrend.percentChange), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-white/70 mt-1">
                  {stats.completionTrend.percentChange >= 0 
                    ? 'Improvement from last week' 
                    : 'Decrease from last week'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Performance Insights Section */}
        <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-white drop-shadow-md mb-4">Performance Insights</h2>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="bg-gray-700 bg-opacity-80 p-5 rounded-lg w-56 h-56 flex flex-col items-center text-center justify-center">
              <div className="flex items-center justify-center mb-3">
                <span className="text-purple-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
              <h3 className="text-md font-medium text-white mb-2">Current Streak</h3>
              <p className="text-3xl font-bold text-white mb-2">{stats?.currentStreak ?? metrics.currentStreak} days</p>
              <p className="text-xs text-white/70">Consecutive days with completed sessions</p>
            </div>
            
            <div className="bg-gray-700 bg-opacity-80 p-5 rounded-lg w-56 h-56 flex flex-col items-center text-center justify-center">
              <div className="flex items-center justify-center mb-3">
                <span className="text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
              <h3 className="text-md font-medium text-white mb-2">Avg. Session Duration</h3>
              <p className="text-2xl font-bold text-white mb-2">{formatDuration(stats?.averageSessionDuration || metrics.longestSession)}</p>
              <p className="text-xs text-white/70">Average duration of your focus sessions</p>
            </div>
            
            <div className="bg-gray-700 bg-opacity-80 p-5 rounded-lg w-56 h-56 flex flex-col items-center text-center justify-center">
              <div className="flex items-center justify-center mb-3">
                <span className="text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
              <h3 className="text-md font-medium text-white mb-2">Most Productive Day</h3>
              <p className="text-2xl font-bold text-white mb-2">{stats?.mostProductiveDay?.day || metrics.mostProductiveDay.day}</p>
              <p className="text-xs text-white/70">{formatDuration(stats?.mostProductiveDay?.minutes || metrics.mostProductiveDay.minutes)} of focus time</p>
            </div>
            
            <div className="bg-gray-700 bg-opacity-80 p-5 rounded-lg w-56 h-56 flex flex-col items-center text-center justify-center">
              <div className="flex items-center justify-center mb-3">
                <span className="text-orange-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
              <h3 className="text-md font-medium text-white mb-2">Daily Average</h3>
              <p className="text-3xl font-bold text-white mb-2">
                {(() => {
                  // Get the value or use a default
                  const value = stats?.averageDailySessions || '0';
                  // Try to convert to number and format if possible
                  let formatted = '0';
                  try {
                    const num = Number(value);
                    if (!isNaN(num)) {
                      formatted = num.toFixed(2);
                    }
                  } catch (e) {
                    // In case of any error, fall back to the original value or 0
                    formatted = String(value);
                  }
                  return formatted;
                })()} sessions
              </p>
              <p className="text-xs text-white/70">Average sessions per active day</p>
            </div>
          </div>
        </div>
        
        {/* Weekly Activity Table */}
        {renderWeeklyActivityTable()}
      </>
    );
  };

  // Render trends tab content
  const renderTrendsTab = () => {
    // Always use prepareSessionData() for consistent data handling
    const chartData = prepareSessionData();
    
    return (
      <div className="grid grid-cols-1 gap-8">
        {/* Time range selector */}
        <div className="bg-gray-800 bg-opacity-80 p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Time Range:</h2>
            <div className="flex space-x-2">
              <button
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  timeRange === '7days' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-white/70 hover:bg-gray-600'
                }`}
                onClick={() => setTimeRange('7days')}
              >
                Last 7 Days
              </button>
              <button
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  timeRange === '30days' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-white/70 hover:bg-gray-600'
                }`}
                onClick={() => setTimeRange('30days')}
              >
                Last 30 Days
              </button>
              <button
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  timeRange === 'all' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-white/70 hover:bg-gray-600'
                }`}
                onClick={() => setTimeRange('all')}
              >
                All Time
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-white drop-shadow-md mb-4">Focus Time by Day</h2>
          <div className="h-80 w-full bg-gray-900 p-4 rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="day" 
                  stroke="#fff"
                  tick={{ fill: '#fff' }}
                />
                <YAxis 
                  stroke="#fff"
                  tick={{ fill: '#fff' }}
                  label={{ 
                    value: 'Minutes', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: '#fff' }
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(30, 30, 30, 0.8)',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                  formatter={(value) => [`${value} mins`, 'Focus Time']}
                />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar 
                  dataKey="focusMinutes" 
                  name="Focus Time (mins)" 
                  fill="#9333ea" // Purple color
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-white drop-shadow-md mb-4">Session Frequency</h2>
          <div className="h-80 w-full bg-gray-900 p-4 rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="day" 
                  stroke="#fff"
                  tick={{ fill: '#fff' }}
                />
                <YAxis 
                  stroke="#fff"
                  tick={{ fill: '#fff' }}
                  label={{ 
                    value: 'Sessions', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: '#fff' }
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(30, 30, 30, 0.8)',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  name="Number of Sessions"
                  stroke="#9333ea" 
                  strokeWidth={2}
                  dot={{ stroke: '#9333ea', strokeWidth: 2, fill: '#9333ea', r: 5 }}
                  activeDot={{ stroke: '#9333ea', strokeWidth: 2, fill: '#9333ea', r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // Render details tab content
  const renderDetailsTab = () => (
    <>
      {sessions.length > 0 && (
        <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-white drop-shadow-md mb-4">Session History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Start Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Duration</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Task</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-700 transition-colors duration-150">
                    <td className="px-4 py-3 text-sm text-white">{formatDate(session.start_time || session.created_at)}</td>
                    <td className="px-4 py-3 text-sm text-white">{formatDuration(session.duration)}</td>
                    <td className="px-4 py-3 text-sm text-white">{session.task_name || session.task || 'No task'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        session.completed 
                          ? 'bg-green-700 text-green-100' 
                          : 'bg-yellow-700 text-yellow-100'
                      }`}>
                        {session.completed ? 'Completed' : 'Interrupted'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!sessions || sessions.length === 0) && (
        <div className="bg-gray-800 bg-opacity-80 p-8 rounded-lg shadow-lg text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg text-white">No sessions recorded yet.</p>
          <p className="mt-2 text-gray-300">Complete a Pomodoro session to see your history.</p>
        </div>
      )}
    </>
  );

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'trends':
        return renderTrendsTab();
      case 'details':
        return renderDetailsTab();
      default:
        return renderOverviewTab();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    const isServerError = error.includes('500') || error.includes('server error');
    return (
      <div className="backdrop-blur-sm bg-white/30 p-6 rounded-lg text-center text-white">
        <h2 className="text-xl font-bold mb-2">{isServerError ? 'Server Error' : 'Error Loading Stats'}</h2>
        <p className="text-lg mb-4">{isServerError 
          ? 'The stats server is currently experiencing issues. This is likely a temporary problem with our backend systems.' 
          : error}</p>
        <button 
          onClick={() => refreshStats()} 
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-6">Pomodoro Statistics</h1>
      
      {/* Tab navigation */}
      {renderTabButtons()}
      
      {/* Tab content */}
      {renderTabContent()}
    </div>
  );
};

export default Stats; 