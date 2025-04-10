import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, TextField, Button, Typography, Box, Alert } from '@mui/material';
import apiService from '../services/api';

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    // Verify token validity
    const checkToken = async () => {
      try {
        if (token) {
          await apiService.auth.verifyResetToken(token);
          setTokenValid(true);
        }
      } catch (err) {
        console.error('Invalid or expired token:', err);
        setTokenValid(false);
        setError('This password reset link is invalid or has expired.');
      }
    };

    if (token) {
      checkToken();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      if (token) {
        await apiService.auth.resetPassword(token, newPassword);
        
        setSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tokenValid) {
    return (
      <Container maxWidth="sm" className="mt-8">
        <Paper elevation={3} className="p-6 bg-gray-800/90 text-white rounded-lg">
          <Typography variant="h5" className="text-center mb-4">Password Reset Failed</Typography>
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
          <Box className="text-center">
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/forgot-password')}
              className="mr-2"
            >
              Request New Link
            </Button>
            <Button 
              variant="outlined" 
              color="secondary"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" className="mt-8">
        <Paper elevation={3} className="p-6 bg-gray-800/90 text-white rounded-lg">
          <Typography variant="h5" className="text-center mb-4">Password Reset Successful</Typography>
          <Alert severity="success" className="mb-4">
            Your password has been successfully reset. You will be redirected to the login page.
          </Alert>
          <Box className="text-center">
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" className="mt-8">
      <Paper elevation={3} className="p-6 bg-gray-800/90 text-white rounded-lg">
        <Typography variant="h5" className="text-center mb-4">Reset Your Password</Typography>
        
        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <TextField
            label="New Password"
            type="password"
            fullWidth
            variant="outlined"
            margin="normal"
            value={newPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
            required
            className="mb-2 bg-gray-700/80 rounded"
          />
          
          <TextField
            label="Confirm New Password"
            type="password"
            fullWidth
            variant="outlined"
            margin="normal"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            required
            className="mb-4 bg-gray-700/80 rounded"
          />
          
          <Box className="mt-4 text-center">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </Box>
        </form>
        
        <Box className="mt-4 text-center">
          <Button
            variant="text"
            color="secondary"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ResetPassword; 