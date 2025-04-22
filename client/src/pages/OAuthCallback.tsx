import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { CircularProgress, Box, Typography, Paper } from '@mui/material';

const OAuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  // Set error immediately on mount if error param exists
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    
    if (errorParam) {
      console.error('OAuth error from server:', errorParam);
      setError(`Authentication error: ${errorParam}`);
      setIsProcessing(false);
    }
  }, [location.search]);
  
  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Extract token from URL query parameters
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const errorParam = params.get('error');
        
        if (errorParam) {
          // Error is already set in the other useEffect
          // Just handle the redirect timing
          
          // Delay redirect for Cypress test to detect the error message
          setTimeout(() => {
            navigate('/login');
          }, 10000); // Increased timeout to ensure test has time to verify
          return;
        }
        
        if (!token) {
          console.error('No token in callback URL');
          setError('No authentication token received');
          setIsProcessing(false);
          
          // Delay redirect
          setTimeout(() => {
            navigate('/login');
          }, 10000);
          return;
        }
        
        console.log('OAuth token received, storing and fetching user data');
        
        // Store the token
        localStorage.setItem('token', token);
        
        // Configure axios with the token
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          // Fetch user data
          console.log('Fetching user data from /api/auth/me');
          const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/me`);
          console.log('User data received:', response.data);
          const userData = response.data;
          setUser(userData);
          
          // Redirect to dashboard
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } catch (fetchError: any) {
          console.error('Error fetching user data:', fetchError);
          console.error('Response:', fetchError.response?.data);
          setError(fetchError.response?.data?.message || 'Failed to fetch user data');
          setIsProcessing(false);
          
          // Still redirect to dashboard after a longer delay since we have a token
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
      } catch (err: any) {
        console.error('OAuth callback processing error:', err);
        setError(err.response?.data?.message || 'Authentication failed');
        setIsProcessing(false);
        
        // Redirect to login after showing error
        setTimeout(() => {
          navigate('/login');
        }, 10000);
      }
    };
    
    processOAuthCallback();
  }, [location, navigate, setUser]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      p={3}
      data-cy="oauth-callback-container"
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 500, width: '100%', textAlign: 'center' }}>
        {error ? (
          <>
            <Typography variant="h5" color="error" gutterBottom data-cy="auth-error-title">
              Authentication Error
            </Typography>
            <Typography color="textSecondary" data-cy="auth-error-message">{error}</Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              {isProcessing ? "Attempting to continue anyway..." : "Redirecting to login..."}
            </Typography>
          </>
        ) : (
          <>
            <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Completing Authentication
            </Typography>
            <Typography color="textSecondary">
              Please wait while we finalize your sign-in...
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default OAuthCallback; 