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
  SvgIconProps,
  useTheme as useMuiTheme
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { authAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { getApiBaseUrl } from '../services/api';

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

// Update the OAuth buttons to use a more efficient approach
interface OAuthButtonProps {
  provider: string;
  icon: React.ReactNode;
  label: string;
}

const OAuthButton: React.FC<OAuthButtonProps> = ({ provider, icon, label }) => {
  const [isLoading, setIsLoading] = useState(false);
  const apiBaseUrl = getApiBaseUrl();
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Use window.location.href instead of a button link to avoid React overhead
    const authUrl = `${apiBaseUrl}/auth/${provider}`;
    console.log(`Redirecting to ${provider} OAuth: ${authUrl}`);
    
    // Set a timeout to prevent multiple rapid attempts
    setTimeout(() => {
      window.location.href = authUrl;
    }, 50);
  };
  
  return (
    <Button
      variant="outlined"
      startIcon={icon}
      fullWidth
      onClick={handleClick}
      disabled={isLoading}
      sx={{
        borderColor: 'rgba(255, 255, 255, 0.2)',
        color: 'text.primary',
        '&:hover': {
          borderColor: 'rgba(255, 255, 255, 0.3)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
      }}
      data-cy={`${provider}-login`}
    >
      {isLoading ? (
        <CircularProgress size={20} color="inherit" />
      ) : (
        `Continue with ${label}`
      )}
    </Button>
  );
};

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
  const theme = useTheme();
  const muiTheme = useMuiTheme();

  // Get the API base URL from the getApiBaseUrl function
  const apiBaseUrl = getApiBaseUrl();

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
    
    // Validate inputs
    if (!loginIdentifier || !password) {
      setError('Please enter both email/username and password');
      setIsLoading(false);
      return;
    }
    
    console.log('Login attempt with:', { loginIdentifier, passwordLength: password.length, rememberMe });

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
          setError('Please verify your email before logging in.');
        } else {
          setError(response.message || 'Login failed. Please check your credentials.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred during login. Please try again.');
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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: 'transparent',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 2,
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            textAlign: 'center',
            fontWeight: 'bold',
            color: 'text.primary',
            mb: 3,
          }}
        >
          Welcome Back
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {needsVerification && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Please verify your email before logging in.
            <Button
              onClick={handleResendVerification}
              disabled={resendingVerification}
              sx={{ ml: 1 }}
            >
              {resendingVerification ? 'Sending...' : 'Resend Verification'}
            </Button>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="loginIdentifier"
              label="Email or Username"
              name="loginIdentifier"
              autoComplete="email username"
              autoFocus
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: muiTheme.palette.primary.main,
                  },
                },
                '& input': {
                  color: 'white',
                },
                '& label': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& label.Mui-focused': {
                  color: muiTheme.palette.primary.main,
                },
              }}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 1,
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    sx={{
                      color: 'primary.main',
                      '&.Mui-checked': {
                        color: 'primary.main',
                      },
                    }}
                  />
                }
                label="Remember me"
              />
              <Link
                to="/forgot-password"
                style={{
                  textDecoration: 'none',
                  color: muiTheme.palette.primary.main,
                }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading || !!lockoutEndTime}
              sx={{
                py: 1.5,
                background: 'linear-gradient(45deg, #9C27B0 30%, #E91E63 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #7B1FA2 30%, #C2185B 90%)',
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : lockoutEndTime ? (
                `Try again in ${timeLeft}`
              ) : (
                'Log In'
              )}
            </Button>

            <Divider sx={{ my: 2 }}>or</Divider>

            <Stack spacing={2}>
              <OAuthButton 
                provider="google" 
                icon={<GoogleIcon />} 
                label="Google" 
              />
              <OAuthButton 
                provider="github" 
                icon={<GithubIcon />} 
                label="GitHub" 
              />
            </Stack>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  style={{
                    textDecoration: 'none',
                    color: muiTheme.palette.primary.main,
                    fontWeight: 'bold',
                  }}
                >
                  Sign up
                </Link>
              </Typography>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default Login; 