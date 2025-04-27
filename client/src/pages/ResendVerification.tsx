import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Alert, 
  CircularProgress 
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import apiService from '../services/api';

const ResendVerification: React.FC = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await apiService.auth.resendVerificationEmail(email);
      setSuccess(true);
      setIsSubmitting(false);
    } catch (err: any) {
      console.error('Failed to resend verification email:', err);
      setError(err.response?.data?.message || 'Failed to resend verification email. Please try again.');
      setIsSubmitting(false);
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
        <EmailIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
        <Typography variant="h5" sx={{ mb: 1 }}>
          Resend Verification Email
        </Typography>
        
        {success ? (
          <Box sx={{ width: '100%', mt: 2 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Verification email has been sent. Please check your inbox.
            </Alert>
            <Typography variant="body1" sx={{ mb: 4, textAlign: 'center' }}>
              If you don't receive an email within a few minutes, please check your spam folder.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </Box>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            <Typography variant="body1" sx={{ mb: 3 }}>
              Enter your email address below, and we'll send you a verification link.
            </Typography>
            <TextField
              label="Email Address"
              type="email"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'gray',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'gray',
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate('/login')}
                disabled={isSubmitting}
              >
                Back to Login
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                startIcon={isSubmitting && <CircularProgress size={20} />}
              >
                {isSubmitting ? 'Sending...' : 'Send Verification Email'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ResendVerification; 