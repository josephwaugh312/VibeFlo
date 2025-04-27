import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { verifyEmail, resendVerificationEmail } from '../services/api';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Alert, 
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { EMAIL_VERIFICATION_STATUSES } from '../constants';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import HelpIcon from '@mui/icons-material/Help';

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>(EMAIL_VERIFICATION_STATUSES.VERIFYING);
  const [email, setEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const { currentTheme } = useTheme();

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus(EMAIL_VERIFICATION_STATUSES.INVALID);
        return;
      }

      try {
        const response = await verifyEmail(token);
        if (response.success || response.message === 'Email verified successfully') {
          setStatus(EMAIL_VERIFICATION_STATUSES.SUCCESS);
          setEmail(response.email || '');
          
          // Store verification status in local storage to use in other parts of the app
          try {
            const userData = localStorage.getItem('user');
            if (userData) {
              const user = JSON.parse(userData);
              user.isVerified = true;
              localStorage.setItem('user', JSON.stringify(user));
            }
          } catch (e) {
            console.error('Error updating local storage:', e);
          }
        } else {
          setStatus(EMAIL_VERIFICATION_STATUSES.FAILED);
          if (response.email) {
            setEmail(response.email);
          }
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        setStatus(EMAIL_VERIFICATION_STATUSES.FAILED);
        // Try to extract email from the error if possible
        if (error.response?.data?.email) {
          setEmail(error.response.data.email);
        }
      }
    };

    verify();
  }, [token]);

  const handleResendVerification = async () => {
    if (!email) return;
    
    setIsResending(true);
    setResendMessage('');
    
    try {
      const response = await resendVerificationEmail(email);
      if (response.success || response.message === 'Verification email sent successfully') {
        setResendMessage('Verification email sent. Please check your inbox and spam folder.');
      } else {
        setResendMessage(response.message || 'Failed to resend verification email.');
      }
    } catch (error: any) {
      console.error('Error resending verification:', error);
      setResendMessage(error.response?.data?.message || 'Failed to resend verification email. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const renderContent = () => {
    switch (status) {
      case EMAIL_VERIFICATION_STATUSES.VERIFYING:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h5" sx={{ mt: 3 }}>
              Verifying your email...
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              This will only take a moment
            </Typography>
          </Box>
        );
      case EMAIL_VERIFICATION_STATUSES.SUCCESS:
        return (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <MarkEmailReadIcon sx={{ fontSize: 80, color: 'success.main' }} />
            </Box>
            
            <Alert severity="success" sx={{ mb: 3, width: '100%' }}>
              Your email has been successfully verified!
            </Alert>
            
            <Typography variant="h5" gutterBottom align="center">
              Thank you for verifying your email address
            </Typography>
            
            <Typography variant="body1" paragraph align="center">
              You now have full access to all features of VibeFlo.
            </Typography>
            
            <List sx={{ mb: 4 }}>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Create personalized music playlists" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Customize your theme and experience" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Access all premium features" 
                />
              </ListItem>
            </List>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleLogin}
                fullWidth
              >
                Go to Login
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={handleGoHome}
                fullWidth
              >
                Go to Home
              </Button>
            </Box>
          </Box>
        );
      case EMAIL_VERIFICATION_STATUSES.FAILED:
        return (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <ErrorIcon sx={{ fontSize: 80, color: 'error.main' }} />
            </Box>
            
            <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
              Verification failed. The link may have expired or is invalid.
            </Alert>
            
            <Typography variant="h5" gutterBottom align="center">
              Unable to verify your email
            </Typography>
            
            <Typography variant="body1" paragraph>
              There was a problem verifying your email address. This could be because:
            </Typography>
            
            <List sx={{ mb: 3 }}>
              <ListItem>
                <ListItemIcon>
                  <HelpIcon color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary="The verification link has expired" 
                  secondary="Verification links are valid for 24 hours"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <HelpIcon color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary="The verification link is invalid" 
                  secondary="The link may be incomplete or corrupted"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <HelpIcon color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary="Your email was already verified" 
                  secondary="You may have clicked the link more than once"
                />
              </ListItem>
            </List>
            
            <Divider sx={{ my: 3 }} />
            
            {email ? (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Need a new verification link?
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleResendVerification}
                  disabled={isResending}
                  fullWidth
                  sx={{ mb: 2 }}
                  startIcon={isResending ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </Button>
                {resendMessage && (
                  <Alert 
                    severity={resendMessage.includes('sent') ? 'success' : 'error'} 
                    sx={{ mt: 2, width: '100%' }}
                  >
                    {resendMessage}
                  </Alert>
                )}
              </Box>
            ) : (
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  to="/resend-verification"
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Go to Verification Page
                </Button>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={handleLogin}
                fullWidth
              >
                Go to Login
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleGoHome}
                fullWidth
              >
                Go to Home
              </Button>
            </Box>
          </Box>
        );
      case EMAIL_VERIFICATION_STATUSES.INVALID:
        return (
          <Box sx={{ width: '100%' }}>
            <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
              Invalid verification request.
            </Alert>
            <Typography variant="h5" gutterBottom align="center">
              Invalid Verification Request
            </Typography>
            <Typography variant="body1" gutterBottom>
              No verification token was provided or the URL is incomplete. 
              Please use the complete verification link from your email or request a new verification email.
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Button 
                variant="contained" 
                color="primary"
                component={Link}
                to="/resend-verification"
                fullWidth
                sx={{ mb: 2 }}
              >
                Request New Verification Email
              </Button>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={handleLogin}
                  fullWidth
                >
                  Go to Login
                </Button>
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  onClick={handleGoHome}
                  fullWidth
                >
                  Go to Home
                </Button>
              </Box>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        p: 3,
        background: currentTheme?.background?.gradient || currentTheme?.background?.color || 'inherit',
        color: currentTheme?.textColor || 'inherit',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 500,
          width: '100%',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Email Verification
        </Typography>
        <Box
          sx={{
            mt: 2,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {renderContent()}
        </Box>
      </Paper>
    </Box>
  );
};

export default VerifyEmail; 