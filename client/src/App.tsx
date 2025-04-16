import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, CssBaseline, Box } from '@mui/material';
import { theme } from './theme';
import Navbar from './components/Navbar';
import ThemeBackground from './components/ThemeBackground';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StatsProvider } from './contexts/StatsContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import PrivateRoute from './components/PrivateRoute';
import { MusicPlayer } from './components/music';
import { MusicPlayerProvider } from './contexts/MusicPlayerContext';
import { Toaster } from 'react-hot-toast';

// Lazy loaded components
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Stats = lazy(() => import('./pages/Stats'));
const Profile = lazy(() => import('./pages/Profile'));
const Help = lazy(() => import('./pages/Help'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ThemeSelector = lazy(() => import('./pages/ThemeSelector'));
const Playlists = lazy(() => import('./pages/Playlists'));
const PlaylistDetail = lazy(() => import('./pages/PlaylistDetail'));
const About = lazy(() => import('./pages/About'));
const Admin = lazy(() => import('./pages/Admin'));

// Root component that handles auth state and routing
const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    // Don't redirect during the initial loading
    if (isLoading) return;
    
    // If not authenticated and not on an allowed public page, redirect to login
    if (!isAuthenticated && window.location.pathname !== '/login' && 
        window.location.pathname !== '/register' && 
        window.location.pathname !== '/forgot-password' &&
        !window.location.pathname.startsWith('/reset-password') &&
        window.location.pathname !== '/privacy' &&
        window.location.pathname !== '/terms' &&
        window.location.pathname !== '/about' &&
        window.location.pathname !== '/') {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, isLoading]);
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/stats" element={<PrivateRoute><Stats /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/themes" element={<PrivateRoute><ThemeSelector /></PrivateRoute>} />
        <Route path="/playlists" element={<PrivateRoute><Playlists /></PrivateRoute>} />
        <Route path="/playlist/:id" element={<PrivateRoute><PlaylistDetail /></PrivateRoute>} />
        <Route path="/help" element={<PrivateRoute><Help /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        color: 'text.primary',
        overflowX: 'hidden',
        width: '100%',
        position: 'relative'
      }}>
        <AuthProvider>
          <ThemeProvider>
            <ThemeBackground />
            <SettingsProvider>
              <StatsProvider>
                <MusicPlayerProvider>
                  <Router>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      minHeight: '100vh',
                      width: '100%',
                      overflowX: 'hidden'
                    }}>
                      <Navbar />
                      <Box 
                        component="main" 
                        sx={{ 
                          flexGrow: 1, 
                          p: 3,
                          pb: '100px',
                          width: '100%'
                        }}
                      >
                        <AppRoutes />
                      </Box>
                      <MusicPlayer />
                    </Box>
                  </Router>
                </MusicPlayerProvider>
              </StatsProvider>
            </SettingsProvider>
          </ThemeProvider>
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#374151',
              color: '#ffffff',
              border: '1px solid #4B5563',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </Box>
    </MuiThemeProvider>
  );
};

export default App;
