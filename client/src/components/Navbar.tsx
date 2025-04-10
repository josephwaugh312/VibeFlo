import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Alert } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 0, textDecoration: 'none', color: 'inherit', mr: 2 }}>
            VibeFlo
          </Typography>
          
          {/* Navigation Links */}
          <Box sx={{ flexGrow: 1, display: 'flex' }}>
            <Button color="inherit" component={RouterLink} to="/about">
              About
            </Button>
            {isAuthenticated && (
              <>
                <Button color="inherit" component={RouterLink} to="/dashboard">
                  Dashboard
                </Button>
                <Button color="inherit" component={RouterLink} to="/stats">
                  Stats
                </Button>
                <Button color="inherit" component={RouterLink} to="/playlists">
                  Playlists
                </Button>
                <Button color="inherit" component={RouterLink} to="/themes">
                  Themes
                </Button>
              </>
            )}
          </Box>
          
          {/* Auth Section */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isAuthenticated ? (
              <>
                <Typography variant="body1" sx={{ mr: 2 }}>
                  @{user?.username}
                </Typography>
                <Button color="inherit" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  component={RouterLink} 
                  to="/login"
                  sx={{ mr: 1 }}
                >
                  Login
                </Button>
                <Button color="inherit" component={RouterLink} to="/register">
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Authentication Alert */}
      {!isAuthenticated && (
        <Alert 
          severity="warning" 
          sx={{ 
            borderRadius: 0,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          You are not logged in. Please <Button 
            component={RouterLink} 
            to="/login"
            color="inherit"
            size="small"
            variant="outlined"
            sx={{ mx: 1 }}
          >
            Log In
          </Button> to see your stats and track your progress.
        </Alert>
      )}
    </>
  );
};

export default Navbar; 