import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-4">
          VibeFlo: Boost Your Productivity
        </h1>
        <p className="text-xl font-semibold text-white drop-shadow-md max-w-3xl mx-auto">
          A modern Pomodoro timer application designed to help you focus, be more productive, and manage your time effectively.
        </p>
        
        <div className="mt-10">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-block bg-purple-600 text-white px-8 py-3 rounded-md font-medium text-lg hover:bg-purple-700 hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Go to Dashboard
            </Link>
          ) : (
            <div className="space-x-4">
              <Link
                to="/login"
                className="inline-block bg-purple-600 text-white px-8 py-3 rounded-md font-medium text-lg hover:bg-purple-700 transition-all"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="inline-block bg-white text-purple-600 border border-purple-600 px-8 py-3 rounded-md font-medium text-lg hover:bg-purple-100 hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Feature boxes with improved responsive layout:
          - Mobile (xs to sm): 1 column (stacked)
          - Tablet (md to lg): 2 columns
          - Desktop (xl and up): 3 columns in one row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">
        <div className="bg-gray-800 bg-opacity-80 p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 backdrop-blur-sm border border-gray-700">
          <div className="text-white mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white drop-shadow-md mb-4">Focus Timer</h2>
          <p className="text-white/90 font-medium leading-relaxed">
            Customize your pomodoro timer settings, add tasks to your queue, and track your productivity with our intuitive interface.
          </p>
        </div>

        <div className="bg-gray-800 bg-opacity-80 p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 backdrop-blur-sm border border-gray-700">
          <div className="text-white mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white drop-shadow-md mb-4">Music Player</h2>
          <p className="text-white/90 font-medium leading-relaxed">
            Create playlists with your favorite YouTube tracks and enjoy background music tailored to your study or work sessions.
          </p>
        </div>

        <div className="bg-gray-800 bg-opacity-80 p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 backdrop-blur-sm border border-gray-700">
          <div className="text-white mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white drop-shadow-md mb-4">Productivity Analytics</h2>
          <p className="text-white/90 font-medium leading-relaxed">
            Gain insights into your productivity patterns with detailed statistics and visualizations of your work sessions.
          </p>
        </div>
      </div>

      <div className="bg-gray-800 bg-opacity-80 p-6 md:p-8 rounded-lg shadow-lg mb-16">
        <h2 className="text-2xl font-bold text-white drop-shadow-md mb-4">About the Pomodoro Technique</h2>
        <p className="text-white/90 font-medium mb-4">
          The Pomodoro Technique is a time management method developed by Francesco Cirillo in the late 1980s. The technique uses a timer to break down work into intervals, traditionally 25 minutes in length, separated by short breaks.
        </p>
        <p className="text-white/90 font-medium mb-4">
          These intervals are named "pomodoros", the plural in English of the Italian word pomodoro (tomato), after the tomato-shaped kitchen timer that Cirillo used as a university student.
        </p>
        <p className="text-white/90 font-medium">
          VibeFlo implements this technique with additional features to help you manage your tasks and track your productivity over time.
        </p>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-white drop-shadow-md mb-6">Ready to boost your productivity?</h2>
        {isAuthenticated ? (
          <Link
            to="/dashboard"
            className="inline-block bg-purple-600 text-white px-8 py-3 rounded-md font-medium text-lg hover:bg-purple-700 hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            Go to Dashboard
          </Link>
        ) : (
          <Link
            to="/register"
            className="inline-block bg-purple-600 text-white px-8 py-3 rounded-md font-medium text-lg hover:bg-purple-700 hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            Get Started for Free
          </Link>
        )}
      </div>
    </div>
  );
};

export default Home; 