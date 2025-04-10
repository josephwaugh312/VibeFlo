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

// Root component that handles auth state and routing
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if not authenticated
  useEffect(() => {
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
  }, [isAuthenticated, navigate]);
  
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
        color: 'text.primary'
      }}>
        <AuthProvider>
          <ThemeProvider>
            <ThemeBackground />
            <SettingsProvider>
              <StatsProvider>
                <Router>
                  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <Navbar />
                    <Box 
                      component="main" 
                      sx={{ 
                        flexGrow: 1, 
                        p: 3,
                        pb: '100px',
                      }}
                    >
                      <AppRoutes />
                    </Box>
                  </Box>
                </Router>
              </StatsProvider>
            </SettingsProvider>
          </ThemeProvider>
        </AuthProvider>
      </Box>
    </MuiThemeProvider>
  );
};

export default App;
