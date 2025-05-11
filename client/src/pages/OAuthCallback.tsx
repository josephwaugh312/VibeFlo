import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, CircularProgress, Paper, Alert, Button } from '@mui/material';
import { useTheme } from '../context/ThemeContext';

const OAuthCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const { currentTheme } = useTheme();
  
  // Parse URL parameters
  const getUrlParams = () => {
    const searchParams = new URLSearchParams(location.search);
    return {
      token: searchParams.get('token'),
      error: searchParams.get('error'),
    };
  };

  useEffect(() => {
    const processOAuth = async () => {
      try {
        const { token, error } = getUrlParams();
        
        // Handle error from OAuth provider
        if (error) {
          console.error('OAuth error:', error);
          setError(`Authentication failed: ${error}`);
          setIsProcessing(false);
          return;
        }
        
        // Check if token exists
        if (!token) {
          console.error('No token received from OAuth provider');
          setError('No authentication token received. Please try again.');
          setIsProcessing(false);
          return;
        }
        
        console.log('OAuth token received, processing authentication...');
        
        // Update authentication state with minimal API calls
        try {
          // Try a simpler approach that doesn't require API calls on callback
          localStorage.setItem('token', token);
          setIsAuthenticated(true);
          
          // Try to parse user info from JWT token
          try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              // Get the payload part of the JWT
              const payload = JSON.parse(atob(tokenParts[1]));
              console.log('Extracted user info from token:', payload);
              
              // Create minimal user object from token payload
              const minimalUser = {
                id: payload.id,
                name: payload.name,
                email: payload.email,
                username: payload.username || payload.email?.split('@')[0] || payload.id,
                // Add other fields to satisfy the User interface
                bio: '',
                avatar_url: '',
                is_verified: true
              };
              
              // Store minimal user data and redirect
              localStorage.setItem('user', JSON.stringify(minimalUser));
              setUser(minimalUser);
              
              // Redirect to dashboard immediately
              navigate('/dashboard', { replace: true });
              return;
            }
          } catch (tokenError) {
            console.error('Error parsing token payload:', tokenError);
            // Continue with API call if token parsing fails
          }
          
          // Only fetch user data if token parsing fails
          console.log('Attempting API call to fetch user data...');
          const response = await fetch('https://vibeflo-api.onrender.com/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch user data: ${response.status}`);
          }
          
          const userData = await response.json();
          
          // Store user data
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          
          // Redirect to dashboard on success
          navigate('/dashboard', { replace: true });
        } catch (error) {
          console.error('Error fetching user data:', error);
          
          // Check for resource constraint errors
          const err = error as Error;
          if (err.message && (
            err.message.includes('ERR_INSUFFICIENT_RESOURCES') || 
            err.message.includes('Network Error')
          )) {
            console.log('Detected resource constraint error, proceeding with limited user info');
            // Still redirect to dashboard - we'll fetch user data there
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 500);
          } else {
            // For other types of errors, still try to proceed
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Error in OAuth callback processing:', error);
        setError('An unexpected error occurred. Please try again.');
        setIsProcessing(false);
      }
    };

    if (isProcessing && attempts < 3) {
      processOAuth();
      setAttempts(prev => prev + 1);
    }
  }, [location, navigate, setUser, setIsAuthenticated, isProcessing, attempts]);

  // Handle retry
  const handleRetry = () => {
    setIsProcessing(true);
    setError(null);
    setAttempts(0);
  };

  // Handle manual login
  const handleManualLogin = () => {
    navigate('/login', { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: 'transparent',
      }}
      data-cy="oauth-callback-container"
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 2,
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          sx={{ textAlign: 'center', mb: 4 }}
          data-cy={error ? "auth-error-title" : "auth-processing-title"}
        >
          {error ? 'Authentication Failed' : 'Processing Authentication'}
        </Typography>

        {isProcessing && !error ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={60} />
            <Typography>
              Processing your authentication...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }} data-cy="auth-error-message">
              {error}
            </Alert>
            <Typography variant="body2" sx={{ mb: 2 }}>
              This could be due to server resource constraints or an authentication error.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleRetry}
                sx={{ flex: 1 }}
                data-cy="retry-auth-button"
              >
                Try Again
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleManualLogin}
                sx={{ flex: 1 }}
                data-cy="manual-login-button"
              >
                Use Email Login
              </Button>
            </Box>
          </Box>
        ) : null}
      </Paper>
    </Box>
  );
};

export default OAuthCallback; 