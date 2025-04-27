import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Box, Alert, Button, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import apiService from '../services/api';

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        if (!token) {
          setError('Verification token is missing.');
          setLoading(false);
          return;
        }

        const response = await apiService.auth.verifyEmail(token);
        setSuccess(true);
        setLoading(false);
      } catch (err: any) {
        console.error('Email verification failed:', err);
        setError(err.response?.data?.message || 'Failed to verify email. The link may be invalid or expired.');
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token]);

  const handleResendEmail = async () => {
    try {
      // This would need the user's email, which we don't have here
      // You could either ask for it or redirect to a page that handles resending
      navigate('/resend-verification');
    } catch (err) {
      console.error('Failed to navigate:', err);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          backgroundColor: 'rgba(20, 20, 20, 0.8)',
          color: 'white',
          borderRadius: 2
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6">Verifying your email...</Typography>
          </Box>
        ) : success ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2 }}>Email Verified Successfully!</Typography>
            <Typography variant="body1" sx={{ mb: 4, textAlign: 'center' }}>
              Your email has been verified. You can now access all features of VibeFlo.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate('/dashboard')}
              sx={{ mb: 1 }}
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
            <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2 }}>Email Verification Failed</Typography>
            <Alert severity="error" sx={{ mb: 4, width: '100%' }}>
              {error}
            </Alert>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleResendEmail}
              sx={{ mb: 1 }}
            >
              Resend Verification Email
            </Button>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default VerifyEmail; 