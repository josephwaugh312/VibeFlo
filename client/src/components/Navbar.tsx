import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Common button styles with purple border on hover
  const buttonStyle = {
    color: 'white',
    borderRadius: '4px',
    transition: 'all 0.2s',
    '&:hover': {
      border: '1px solid rgb(124, 58, 237)', // Purple border on hover
      backgroundColor: 'rgba(124, 58, 237, 0.3)', // More visible purple background
      color: 'white' // Ensure text stays white
    }
  };

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
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/about"
              sx={buttonStyle}
            >
              About
            </Button>
            {isAuthenticated && (
              <>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/dashboard"
                  sx={buttonStyle}
                >
                  Dashboard
                </Button>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/stats"
                  sx={buttonStyle}
                >
                  Stats
                </Button>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/playlists"
                  sx={buttonStyle}
                >
                  Playlists
                </Button>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/themes"
                  sx={buttonStyle}
                >
                  Themes
                </Button>
              </>
            )}
          </Box>
          
          {/* Auth Section */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isAuthenticated ? (
              <>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/profile"
                  sx={{
                    ...buttonStyle,
                    mr: 2
                  }}
                >
                  Profile
                </Button>
                <Button 
                  color="inherit" 
                  onClick={handleLogout}
                  sx={buttonStyle}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="contained" 
                  color="primary"
                  component={RouterLink} 
                  to="/login"
                  sx={{ 
                    mr: 1,
                    bgcolor: 'rgb(124, 58, 237)', /* Tailwind's purple-600 */
                    '&:hover': {
                      bgcolor: 'rgb(109, 40, 217)' /* Tailwind's purple-700 */
                    }
                  }}
                >
                  Login
                </Button>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/register"
                  sx={buttonStyle}
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default Navbar; 