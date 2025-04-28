import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, TextField, Button, Box, Alert, CircularProgress, Stack } from '@mui/material';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useTheme } from '@mui/material/styles';
import EmailIcon from '@mui/icons-material/Email';

const ResendVerification: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const response = await authAPI.resendVerificationEmail(email);
      
      console.log('Resend verification response:', response);
      
      if (response.success) {
        setSuccess(true);
        setError('');
      } else {
        setError(response.message || 'Failed to resend verification email');
      }
    } catch (err: any) {
      console.error('Error resending verification email:', err);
      setError(err.response?.data?.message || 'An error occurred while resending the verification email');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          bgcolor: theme.palette.background.paper
        }}
      >
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
          <EmailIcon sx={{ fontSize: 40, mb: 1, color: theme.palette.primary.main }} />
          <Typography component="h1" variant="h5">
            Resend Verification Email
          </Typography>
        </Box>

        {success ? (
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Success! We've sent a new verification email to <strong>{email}</strong>
            </Alert>
            <Typography variant="body2" sx={{ mb: 3 }}>
              Please check your inbox and spam folder. The verification link will expire after 24 hours.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                color="primary"
                component={Link}
                to="/login"
              >
                Return to Login
              </Button>
              <Button
                variant="outlined"
                onClick={handleSubmit}
                disabled={submitting}
              >
                Resend Again
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              Enter your email address below to receive a new verification link. If you don't receive the email, check your spam folder.
            </Typography>
            
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
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {submitting ? 'Sending...' : 'Resend Verification Email'}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button 
                component={Link} 
                to="/login"
                color="primary"
              >
                Back to Login
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ResendVerification; 