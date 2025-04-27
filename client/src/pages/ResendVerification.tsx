import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Alert, 
  CircularProgress,
  useTheme,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { authAPI } from '../services/api';

const ResendVerification: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [emailAlreadyVerified, setEmailAlreadyVerified] = useState(false);

  // Get email from URL parameters if available
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setEmailAlreadyVerified(false);
    
    try {
      const response = await authAPI.resendVerificationEmail(email);
      
      console.log('Verification email sent:', response);
      setSuccess(true);
      setIsSubmitting(false);
    } catch (err: any) {
      console.error('Failed to resend verification email:', err);
      const errorMessage = err.response?.data?.message || 'Failed to resend verification email. Please try again.';
      
      // Check if the error is because the email is already verified
      if (errorMessage.includes('already verified')) {
        setEmailAlreadyVerified(true);
      }
      
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 2,
          bgcolor: 'background.paper'
        }}
      >
        <EmailIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
        <Typography variant="h5" sx={{ mb: 1 }}>
          Email Verification
        </Typography>
        
        {emailAlreadyVerified ? (
          <Box sx={{ width: '100%', mt: 2 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Good news! Your email <strong>{email}</strong> is already verified.
            </Alert>
            <Typography variant="body1" sx={{ mb: 4, textAlign: 'center' }}>
              You can now log in to your account and access all features.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/login')}
                fullWidth
              >
                Go to Login
              </Button>
            </Box>
          </Box>
        ) : success ? (
          <Box sx={{ width: '100%', mt: 2 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Verification email has been sent to <strong>{email}</strong>
            </Alert>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Please check your inbox for the verification link. The email should arrive within a few minutes.
            </Typography>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Important Information:
            </Typography>
            
            <List sx={{ mb: 3 }}>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon color="info" />
                </ListItemIcon>
                <ListItemText 
                  primary="Check your spam or junk folder" 
                  secondary="Email providers sometimes filter verification emails"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color="warning" />
                </ListItemIcon>
                <ListItemText 
                  primary="The verification link expires in 24 hours" 
                  secondary="Make sure to click it before it expires"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Once verified, you'll have full access" 
                  secondary="You'll be able to use all features of VibeFlo"
                />
              </ListItem>
            </List>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => setSuccess(false)}
                sx={{ flexGrow: 1 }}
              >
                Try Different Email
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/login')}
                sx={{ flexGrow: 1 }}
              >
                Go to Login
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
              Enter your email address below, and we'll send you a new verification link.
            </Typography>
            <TextField
              label="Email Address"
              type="email"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              sx={{ mb: 3 }}
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
                startIcon={isSubmitting && <CircularProgress size={20} color="inherit" />}
              >
                {isSubmitting ? 'Sending...' : 'Send Verification Email'}
              </Button>
            </Box>
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2">
                Already verified?{' '}
                <Link to="/login" style={{ color: theme.palette.primary.main, textDecoration: 'none' }}>
                  Sign in here
                </Link>
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ResendVerification; 