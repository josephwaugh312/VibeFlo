import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, CssBaseline, Box } from '@mui/material';
import { theme } from './theme';
import './App.css'; // Import App CSS 
import Navbar from './components/Navbar';
import ThemeBackground from './components/ThemeBackground';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StatsProvider } from './contexts/StatsContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { TimerProvider } from './contexts/TimerContext';
import PrivateRoute from './components/PrivateRoute';
import { MusicPlayer } from './components/music';
import { MusicPlayerProvider } from './contexts/MusicPlayerContext';
import { Toaster } from 'react-hot-toast';
import VerifyEmail from './pages/VerifyEmail';
import ResendVerification from './pages/ResendVerification';

// Add type declaration for the window object
declare global {
  interface Window {
    changeThemeBackground: (imageUrl: string) => boolean;
  }
}

// Add basic theme CSS to ensure the page always has a background
const applyBasicThemeBackground = () => {
  const styleElement = document.createElement('style');
  styleElement.id = 'basic-theme-background';
  styleElement.textContent = `
    body {
      background-image: linear-gradient(135deg, #8e44ad 0%, #3498db 100%);
      background-size: cover;
      background-position: center center;
      background-attachment: fixed;
      background-repeat: no-repeat;
      color: white;
    }
    
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.4);
      z-index: -1;
    }
  `;
  document.head.appendChild(styleElement);
};

// Apply basic theme immediately
applyBasicThemeBackground();

// Global function to change theme background
window.changeThemeBackground = (imageUrl) => {
  try {
    // Remove existing theme styles
    const existingStyle = document.getElementById('applied-theme-style');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Check if it's a URL or CSS value (like a gradient)
    const isBase64 = imageUrl.startsWith('data:');
    const isGradient = imageUrl.startsWith('linear-gradient');
    const isImageUrl = !isGradient && !isBase64;
    
    // Format the CSS value appropriately based on type
    const imageUrlForCSS = isImageUrl ? `url("${imageUrl}")` : 
                          isBase64 ? `url(${imageUrl})` : 
                          imageUrl;
    
    // Create style element with new background
    const styleElement = document.createElement('style');
    styleElement.id = 'applied-theme-style';
    styleElement.textContent = `
      body {
        background-image: ${imageUrlForCSS};
        background-size: cover;
        background-position: center center;
        background-attachment: fixed;
        background-repeat: no-repeat;
        transition: background-image 0.5s ease;
      }
    `;
    document.head.appendChild(styleElement);
    console.log(`Global window.changeThemeBackground applied (first 50 chars): ${imageUrlForCSS.substring(0, 50)}...`);
    return true;
  } catch (error) {
    console.error('Failed to change theme background:', error);
    return false;
  }
};

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
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));

// Root component that handles auth state and routing
const AppRoutes = () => {
  const { isAuthenticated, isLoading, initializeAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log('AppRoutes: Initializing auth state');
    
    const initAuth = async () => {
      try {
        await initializeAuth();
        console.log('AppRoutes: Auth initialization complete');
      } catch (error) {
        console.error('AppRoutes: Auth initialization failed:', error);
      }
    };
    
    initAuth();
  }, []);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    // Don't redirect during the initial loading
    if (isLoading) {
      console.log('AppRoutes: Still loading auth state, not redirecting');
      return;
    }
    
    // If not authenticated and not on an allowed public page, redirect to login
    if (!isAuthenticated && window.location.pathname !== '/login' && 
        window.location.pathname !== '/register' && 
        window.location.pathname !== '/forgot-password' &&
        !window.location.pathname.startsWith('/reset-password') &&
        window.location.pathname !== '/privacy' &&
        window.location.pathname !== '/terms' &&
        window.location.pathname !== '/about' &&
        window.location.pathname !== '/oauth-callback' &&
        window.location.pathname !== '/') {
      console.log('AppRoutes: Not authenticated, redirecting to login');
      navigate('/login');
    } else {
      console.log('AppRoutes: Authentication state:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
      console.log('AppRoutes: Current path:', window.location.pathname);
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
        <Route path="/oauth-callback" element={<OAuthCallback />} />
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
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/resend-verification" element={<ResendVerification />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

// Authenticated wrapper for MusicPlayer to only render when user is authenticated
const AuthenticatedMusicPlayer = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return null;
  return <MusicPlayer />;
};

const App: React.FC = () => {
  console.log('App component rendering');

  useEffect(() => {
    // Load theme from localStorage if available
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme);
        const imageUrl = theme.background_url || theme.image_url;
        
        if (imageUrl) {
          // Check if it's a URL or CSS value (like a gradient)
          const isImageUrl = !imageUrl.startsWith('linear-gradient') && !imageUrl.startsWith('data:');
          const backgroundValue = isImageUrl ? `url("${imageUrl}")` : imageUrl;
          
          // Clear any existing background first
          document.body.style.background = 'none';
          
          // Set the background
          document.body.style.backgroundImage = backgroundValue;
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundPosition = 'center center';
          document.body.style.backgroundAttachment = 'fixed';
          document.body.style.backgroundRepeat = 'no-repeat';
          
          console.log(`App initial theme applied: ${theme.name}, using background: ${backgroundValue}`);
        }
      } catch (error) {
        console.error('Error loading theme from localStorage:', error);
      }
    }
  }, []);

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
                  <TimerProvider>
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
                        <AuthenticatedMusicPlayer />
                      </Box>
                    </Router>
                  </TimerProvider>
                </MusicPlayerProvider>
              </StatsProvider>
            </SettingsProvider>
          </ThemeProvider>
        </AuthProvider>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              duration: 3000,
            },
            error: {
              duration: 5000,
            }
          }}
        />
      </Box>
    </MuiThemeProvider>
  );
};

export default App;
