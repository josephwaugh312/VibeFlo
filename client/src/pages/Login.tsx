import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  TextField, 
  Button, 
  Typography, 
  Container, 
  Box, 
  InputAdornment, 
  IconButton,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Stack
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { API_BASE_URL } from '../config';
import GoogleIcon from '../assets/icons/google.svg';
import GithubIcon from '../assets/icons/github.svg';
import FacebookIcon from '../assets/icons/facebook.svg';
import { useTheme } from '../context/ThemeContext';

const Login: React.FC = () => {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showFacebookNotice, setShowFacebookNotice] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { currentTheme } = useTheme();

  // Get the API base URL from environment or use default
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (lockoutEndTime) {
      timer = setInterval(() => {
        const now = new Date();
        const diff = lockoutEndTime.getTime() - now.getTime();
        
        if (diff <= 0) {
          setLockoutEndTime(null);
          setTimeLeft('');
          clearInterval(timer);
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lockoutEndTime]);

  // Hide Facebook notice after 3 seconds
  useEffect(() => {
    let noticeTimer: NodeJS.Timeout;
    
    if (showFacebookNotice) {
      noticeTimer = setTimeout(() => {
        setShowFacebookNotice(false);
      }, 3000);
    }
    
    return () => {
      if (noticeTimer) clearTimeout(noticeTimer);
    };
  }, [showFacebookNotice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setNeedsVerification(false);
    console.log('Login attempt with:', { loginIdentifier, rememberMe });

    try {
      console.log('About to call login API...');
      // Use the login function from AuthContext directly with rememberMe
      const response = await authLogin(loginIdentifier, password, rememberMe);
      console.log('Login response:', response);
      
      if (response.success) {
        console.log('Login successful, navigating to dashboard');
        
        // Debug current path
        console.log('Current path before navigation:', window.location.pathname);
        
        // Try to force a page reload to dashboard
        window.location.href = '/dashboard';
        
        // The code below won't execute if the location changes
        console.log('If you see this, the location change did not happen immediately');
      } else {
        // Check if the account needs verification
        if (response.needsVerification) {
          setVerificationEmail(response.email || loginIdentifier);
          setNeedsVerification(true);
          setError('Please verify your email before logging in');
        } else {
          setError(response.message || 'Login failed. Please check your credentials.');
        }
      }
    } catch (err: any) {
      console.error('Login error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      if (err.response?.status === 429) {
        // Extract lockout end time from error message
        const match = err.response?.data?.message?.match(/try again in (\d+) minutes/);
        if (match) {
          const minutes = parseInt(match[1]);
          const endTime = new Date();
          endTime.setMinutes(endTime.getMinutes() + minutes);
          setLockoutEndTime(endTime);
        }
      }
      
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowFacebookNotice(true);
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;
    
    try {
      setResendingVerification(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: verificationEmail }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResendSuccess(true);
        setError('');
      } else {
        setError(data.message || 'Failed to resend verification email');
      }
    } catch (err) {
      setError('An error occurred while resending the verification email');
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Log In
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            {needsVerification && verificationEmail && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Your email address needs to be verified before you can log in.
                </Typography>
                <Button 
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  size="small"
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={resendingVerification ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{ mb: 1 }}
                >
                  {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  fullWidth
                  component={Link}
                  to={`/resend-verification?email=${encodeURIComponent(verificationEmail)}`}
                >
                  Go to Verification Page
                </Button>
              </Box>
            )}
          </Alert>
        )}
        
        {resendSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Verification email sent! Please check your inbox and spam folder.
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={loginIdentifier}
            onChange={(e) => {
              setLoginIdentifier(e.target.value);
              setError('');
              setResendSuccess(false);
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
              setResendSuccess(false);
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading || !!lockoutEndTime}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
          </Button>
          
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="primary">
                Forgot password?
              </Typography>
            </Link>
          </Box>
          
          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<img src={GoogleIcon} alt="Google" width="20" />}
              href={`https://vibeflo-api.onrender.com/api/auth/google`}
              sx={{ textTransform: 'none' }}
            >
              Continue with Google
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<img src={GithubIcon} alt="GitHub" width="20" />}
              href={`https://vibeflo-api.onrender.com/api/auth/github`}
              sx={{ textTransform: 'none' }}
            >
              Continue with GitHub
            </Button>
          </Box>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <Typography component="span" variant="body2" color="primary">
                  Sign up
                </Typography>
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login; 