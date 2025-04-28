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
  Stack,
  SvgIcon,
  SvgIconProps
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { authAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

// SVG Icon components
const GoogleIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
    <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09c1.97 3.92 6.02 6.62 10.71 6.62z"/>
    <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29v-3.09h-3.98c-.8 1.61-1.26 3.43-1.26 5.38s.46 3.77 1.26 5.38l3.98-3.09z"/>
    <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42c-2.07-1.94-4.78-3.13-8.02-3.13-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
  </SvgIcon>
);

const GithubIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </SvgIcon>
);

const FacebookIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M22 12c0-5.523-4.477-10-10-10s-10 4.477-10 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54v-2.891h2.54v-2.203c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.876h2.773l-.443 2.891h-2.33v6.988c4.781-.75 8.437-4.887 8.437-9.878z" />
  </SvgIcon>
);

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
    setResendSuccess(false);
    console.log('Login attempt with:', { loginIdentifier, rememberMe });

    try {
      console.log('About to call login API...');
      const response = await authLogin(loginIdentifier, password, rememberMe);
      console.log('Login response:', response);
      
      if (response.success) {
        console.log('Login successful, navigating to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        // Check if the account needs verification
        if (response.needsVerification) {
          setVerificationEmail(response.email || loginIdentifier);
          setNeedsVerification(true);
          setError('Email verification required');
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
      setResendSuccess(false);
      const response = await authAPI.resendVerificationEmail(verificationEmail);
      
      console.log('Resend verification response:', response);
      
      if (response.success) {
        setResendSuccess(true);
        setError('');
      } else {
        setError(response.message || 'Failed to resend verification email');
      }
    } catch (err: any) {
      console.error('Error resending verification email:', err);
      setError(err.response?.data?.message || 'An error occurred while resending the verification email');
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
            {needsVerification ? 'Your email address needs to be verified before you can log in.' : error}
            {needsVerification && verificationEmail && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  We've sent a verification email to <strong>{verificationEmail}</strong>. Please check your inbox and spam folder.
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Button 
                    onClick={handleResendVerification}
                    disabled={resendingVerification || resendSuccess}
                    size="small"
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={resendingVerification ? <CircularProgress size={20} color="inherit" /> : null}
                  >
                    {resendingVerification ? 'Sending...' : resendSuccess ? 'Email Sent' : 'Resend Verification Email'}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    fullWidth
                    component={Link}
                    to={`/resend-verification?email=${encodeURIComponent(verificationEmail)}`}
                  >
                    Verification Help
                  </Button>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  If you don't receive the email within a few minutes, check your spam folder or use the Verification Help page.
                </Typography>
              </Box>
            )}
          </Alert>
        )}
        
        {resendSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Verification email sent to <strong>{verificationEmail}</strong>! Please check your inbox and spam folder.
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
            type={showPassword ? "text" : "password"}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
              setResendSuccess(false);
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
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
              startIcon={<GoogleIcon />}
              href={`https://vibeflo-api.onrender.com/api/auth/google`}
              sx={{ textTransform: 'none' }}
            >
              Continue with Google
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GithubIcon />}
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