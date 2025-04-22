import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Container, TextField, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import apiService from '../services/api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const logMessage = (message: string) => {
    setDebugLog(prev => [...prev, message]);
    console.log(message);
  };

  const handleDirectSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    logMessage('Starting direct test...');
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      logMessage(`Testing endpoint: ${apiUrl}/auth/forgot-password`);
      
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      logMessage(`Response status: ${response.status} (${response.statusText})`);
      
      try {
        const data = await response.json();
        logMessage(`Response data: ${JSON.stringify(data)}`);
        if (response.ok) {
          setSuccess(true);
        } else {
          setError(data.message || 'Unknown error');
        }
      } catch (jsonErr) {
        logMessage(`Error parsing JSON: ${jsonErr}`);
        const text = await response.text();
        logMessage(`Raw response: ${text.substring(0, 100)}...`);
        setError('Error parsing server response');
      }
    } catch (err) {
      logMessage(`Fetch error: ${err}`);
      setError('Network error when contacting server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    logMessage('Starting API service test...');
    
    try {
      await apiService.auth.requestPasswordReset(email);
      logMessage('API service call successful');
      setSuccess(true);
    } catch (err: any) {
      logMessage(`API service error: ${JSON.stringify(err)}`);
      setError(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDebugLog([]); // Clear logs
    await handleDirectSubmit();
  };

  return (
    <Container maxWidth="sm" className="mt-8">
      <Paper 
        elevation={3} 
        className="p-6 bg-gray-800/90 text-white rounded-lg"
      >
        <Typography variant="h5" className="text-center mb-4">
          Forgot Password
        </Typography>
        
        {success ? (
          <Box className="w-full mt-2">
            <Alert severity="success" className="mb-4">
              Password reset instructions have been sent to your email. Please check your inbox and follow the instructions to reset your password.
            </Alert>
            <Button 
              component={Link} 
              to="/login"
              variant="contained"
              color="primary"
              fullWidth
              className="mt-3 mb-2"
            >
              Return to Login
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} className="w-full mt-2">
            <Typography variant="body2" className="mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </Typography>
            
            {error && (
              <Alert severity="error" className="mb-4">
                {error}
              </Alert>
            )}
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className="mb-4 bg-gray-700/80 rounded"
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              className="mt-4 mb-3"
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Send Reset Link (Direct)'}
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              disabled={isSubmitting}
              onClick={handleServiceSubmit}
              className="mb-3"
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Try API Service'}
            </Button>
            
            <Box className="flex justify-between mt-4">
              <Button 
                component={Link} 
                to="/login" 
                color="secondary"
              >
                Back to Login
              </Button>
              <Button 
                component={Link} 
                to="/register" 
                color="secondary"
              >
                Create Account
              </Button>
            </Box>
            
            {/* Debug logs */}
            {debugLog.length > 0 && (
              <Box className="mt-4 p-2 bg-gray-900 rounded text-xs font-mono">
                <Typography variant="subtitle2" className="mb-1">Debug Log:</Typography>
                {debugLog.map((log, i) => (
                  <div key={i} className="mb-1">{log}</div>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ForgotPassword; 