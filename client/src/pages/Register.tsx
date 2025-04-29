import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Container, 
  Alert, 
  Paper, 
  CircularProgress,
  useTheme
} from '@mui/material';
import { authAPI } from '../services/api';
import { useTheme as useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useMuiTheme } from '@mui/material/styles';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentTheme } = useAppTheme();
  const { register } = useAuth();
  const muiTheme = useMuiTheme();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await register(formData.email, formData.username, formData.password);
      setSuccess('Registration successful! Please check your email to verify your account. You will be redirected to the login page in a few seconds.');
      console.log('Registration successful, verification email should be sent');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
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
        elevation={0}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            textAlign: 'center',
            color: '#fff',
            fontWeight: 'bold',
            mb: 3,
          }}
        >
          Create Account
        </Typography>
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2,
              borderRadius: '12px',
              background: 'rgba(46, 125, 50, 0.1)',
              border: '1px solid rgba(46, 125, 50, 0.2)'
            }}
          >
            {success}
          </Alert>
        )}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              borderRadius: '12px',
              background: 'rgba(211, 47, 47, 0.1)',
              border: '1px solid rgba(211, 47, 47, 0.2)'
            }}
          >
            {error}
          </Alert>
        )}
        
        <Typography 
          variant="body2" 
          color="textSecondary" 
          paragraph 
          align="center"
          sx={{ mb: 2 }}
        >
          Join VibeFlo to create personalized music playlists and enhance your productivity
        </Typography>
        
        <Typography 
          variant="body2" 
          color="primary" 
          paragraph 
          align="center" 
          sx={{ 
            fontWeight: 'medium',
            mb: 3,
            color: currentTheme?.primary_color || theme.palette.primary.main
          }}
        >
          You'll need to verify your email address after registration. A verification link will be sent to your email.
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            error={!!errors.name}
            helperText={errors.name}
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&:hover fieldset': {
                  borderColor: currentTheme?.primary_color || theme.palette.primary.main,
                },
              },
            }}
          />
          
          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            error={!!errors.username}
            helperText={errors.username}
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&:hover fieldset': {
                  borderColor: currentTheme?.primary_color || theme.palette.primary.main,
                },
              },
            }}
          />
          
          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            error={!!errors.email}
            helperText={errors.email}
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&:hover fieldset': {
                  borderColor: currentTheme?.primary_color || theme.palette.primary.main,
                },
              },
            }}
          />
          
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            error={!!errors.password}
            helperText={errors.password}
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&:hover fieldset': {
                  borderColor: currentTheme?.primary_color || theme.palette.primary.main,
                },
              },
            }}
          />
          
          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&:hover fieldset': {
                  borderColor: currentTheme?.primary_color || theme.palette.primary.main,
                },
              },
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              borderRadius: '12px',
              background: 'linear-gradient(45deg, #9C27B0 30%, #E91E63 90%)',
              color: '#fff',
              '&:hover': {
                background: 'linear-gradient(45deg, #7B1FA2 30%, #C2185B 90%)',
              },
            }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
          </Button>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                style={{ 
                  textDecoration: 'none',
                  color: currentTheme?.primary_color || theme.palette.primary.main,
                  fontWeight: 'bold'
                }}
              >
                Log In
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default Register; 