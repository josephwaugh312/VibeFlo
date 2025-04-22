import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// SVG Icons for OAuth providers
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
    </g>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fill="currentColor" />
  </svg>
);

const GitHubIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" fill="currentColor" />
  </svg>
);

const Login: React.FC = () => {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showFacebookNotice, setShowFacebookNotice] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Get the API base URL from environment or use default
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (lockoutEndTime) {
      timer = setInterval(() => {
        const now = new Date();
        const diff = lockoutEndTime.getTime() - now.getTime();
        
        if (diff <= 0) {
          setLockoutEndTime(null);
          setTimeLeft('');
          clearInterval(timer);
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lockoutEndTime]);

  // Hide Facebook notice after 3 seconds
  useEffect(() => {
    let noticeTimer: NodeJS.Timeout;
    
    if (showFacebookNotice) {
      noticeTimer = setTimeout(() => {
        setShowFacebookNotice(false);
      }, 3000);
    }
    
    return () => {
      if (noticeTimer) clearTimeout(noticeTimer);
    };
  }, [showFacebookNotice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    console.log('Login attempt with:', { loginIdentifier, rememberMe });

    try {
      // Use the login function from AuthContext directly with rememberMe
      await login(loginIdentifier, password, rememberMe);
      console.log('Login successful, navigating to dashboard');
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Response data:', err.response?.data);
      
      if (err.response?.status === 429) {
        // Extract lockout end time from error message
        const match = err.response?.data?.message?.match(/try again in (\d+) minutes/);
        if (match) {
          const minutes = parseInt(match[1]);
          const endTime = new Date();
          endTime.setMinutes(endTime.getMinutes() + minutes);
          setLockoutEndTime(endTime);
        }
      }
      
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowFacebookNotice(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-gray-800 bg-opacity-80 p-8 rounded-lg shadow-lg space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-white/70">
            Or{' '}
            <Link to="/register" className="font-medium text-purple-300 hover:text-white">
              create a new account
            </Link>
          </p>
        </div>
        {error && (
          <div className="bg-red-900/70 border border-red-500 text-white px-4 py-3 rounded-lg shadow-lg relative" role="alert">
            <span className="block sm:inline">{error}</span>
            {lockoutEndTime && (
              <div className="mt-2 text-sm">
                Time remaining: {timeLeft}
              </div>
            )}
          </div>
        )}
        {showFacebookNotice && (
          <div className="bg-blue-900/70 border border-blue-500 text-white px-4 py-3 rounded-lg shadow-lg relative animation-fade-in" role="alert">
            <span className="block sm:inline">Facebook login coming soon!</span>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} role="form">
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                disabled={!!lockoutEndTime}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!!lockoutEndTime}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 bg-gray-700 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-white">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-purple-300 hover:text-white">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !!lockoutEndTime}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* OAuth Login Buttons */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {/* Google Login */}
            <a
              href={`${API_BASE_URL}/auth/google`}
              className="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-white text-sm font-medium text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              data-cy="google-login"
            >
              <span className="sr-only">Sign in with Google</span>
              <GoogleIcon />
            </a>

            {/* Facebook Login - Now with Coming Soon notice */}
            <button
              onClick={handleFacebookClick}
              className="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-[#1877F2] text-sm font-medium text-white hover:bg-[#166FE5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative"
              data-cy="facebook-login"
            >
              <span className="sr-only">Sign in with Facebook</span>
              <FacebookIcon />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500 text-[0.6rem] text-white flex items-center justify-center font-bold">!</span>
              </span>
            </button>

            {/* GitHub Login */}
            <a
              href={`${API_BASE_URL}/auth/github`}
              className="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-[#24292e] text-sm font-medium text-white hover:bg-[#2c3339] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              data-cy="github-login"
            >
              <span className="sr-only">Sign in with GitHub</span>
              <GitHubIcon />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 