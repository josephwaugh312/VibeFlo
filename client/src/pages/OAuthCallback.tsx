import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { CircularProgress, Box, Typography, Paper } from '@mui/material';
import apiService from '../services/api';

const OAuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setIsAuthenticated, initializeAuth } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    
    if (errorParam) {
      console.error('OAuth error from server:', errorParam);
      setError(`Authentication error: ${errorParam}`);
      setIsProcessing(false);
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [location.search, navigate]);
  
  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        
        if (!token) {
          console.error('No token in callback URL');
          setError('No authentication token received');
          setIsProcessing(false);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        console.log('OAuth token received, initializing authentication');
        
        // Store the token and initialize auth context
        localStorage.setItem('token', token);
        
        // Configure axios and API service with the token
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        apiService.setToken(token);
        
        try {
          // Initialize auth context which will fetch and validate user data
          await initializeAuth();
          
          // If initialization succeeds, redirect to dashboard
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } catch (authError: any) {
          console.error('Error initializing authentication:', authError);
          
          // Clear any invalid data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          axios.defaults.headers.common['Authorization'] = '';
          apiService.setToken(null);
          
          setError('Failed to complete authentication. Please try again.');
          setIsProcessing(false);
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err: any) {
        console.error('OAuth callback processing error:', err);
        setError(err.response?.data?.message || 'Authentication failed');
        setIsProcessing(false);
        setTimeout(() => navigate('/login'), 3000);
      }
    };
    
    processOAuthCallback();
  }, [location, navigate, setUser, setIsAuthenticated, initializeAuth]);

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
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          maxWidth: 500, 
          width: '100%', 
          textAlign: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'white'
        }}
      >
        {error ? (
          <>
            <Typography variant="h5" color="error" gutterBottom data-cy="auth-error-title">
              Authentication Error
            </Typography>
            <Typography color="rgba(255, 255, 255, 0.7)" data-cy="auth-error-message">
              {error}
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, color: 'rgba(255, 255, 255, 0.5)' }}>
              Redirecting to login...
            </Typography>
          </>
        ) : (
          <>
            <CircularProgress 
              size={60} 
              thickness={4} 
              sx={{ 
                mb: 3,
                color: theme => theme.palette.primary.main
              }} 
            />
            <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
              Completing Authentication
            </Typography>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Please wait while we finalize your sign-in...
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default OAuthCallback; 