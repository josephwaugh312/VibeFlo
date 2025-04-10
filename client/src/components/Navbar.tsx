import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Import Material UI icons that could be used as avatars
import PersonIcon from '@mui/icons-material/Person';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import FaceIcon from '@mui/icons-material/Face';
import Pets from '@mui/icons-material/Pets';
import MoodIcon from '@mui/icons-material/Mood';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

// Map of icon identifiers to icon components
const iconMap: { [key: string]: React.ReactNode } = {
  'person': <PersonIcon />,
  'emoji': <EmojiEmotionsIcon />,
  'face': <FaceIcon />,
  'pets': <Pets />,
  'mood': <MoodIcon />,
  'play': <PlayArrowIcon />,
  'power': <PowerSettingsNewIcon />,
  'headphones': <HeadphonesIcon />,
  'sports': <SportsEsportsIcon />,
  'music': <MusicNoteIcon />,
  'diversity': <Diversity3Icon />,
  'fire': <LocalFireDepartmentIcon />,
};

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

  // Function to render avatar based on the user's avatar URL
  const getAvatarElement = () => {
    if (!user || !user.avatarUrl) {
      return (
        <Avatar 
          sx={{ 
            width: 30, 
            height: 30,
            bgcolor: 'secondary.main',
            fontSize: '0.9rem'
          }}
        >
          {user?.name?.charAt(0) || user?.username?.charAt(0) || '?'}
        </Avatar>
      );
    }
    
    if (user.avatarUrl.startsWith('#')) {
      // Color avatar
      return (
        <Avatar
          sx={{ 
            width: 30, 
            height: 30,
            bgcolor: user.avatarUrl,
            fontSize: '0.9rem'
          }}
        >
          {user.name?.charAt(0) || user.username?.charAt(0) || '?'}
        </Avatar>
      );
    } else if (user.avatarUrl.startsWith('icon:')) {
      // Icon avatar
      const iconKey = user.avatarUrl.substring(5); // Remove "icon:" prefix
      return (
        <Avatar
          sx={{ 
            width: 30, 
            height: 30,
            bgcolor: '#333',
            color: 'white',
            fontSize: '0.9rem'
          }}
        >
          {iconMap[iconKey] || '?'}
        </Avatar>
      );
    } else if (user.avatarUrl.startsWith('linear-gradient')) {
      // Gradient avatar
      return (
        <Avatar
          sx={{ 
            width: 30, 
            height: 30,
            background: user.avatarUrl,
            fontSize: '0.9rem'
          }}
        >
          {user.name?.charAt(0) || user.username?.charAt(0) || '?'}
        </Avatar>
      );
    } else {
      // Regular URL avatar
      return (
        <Avatar
          src={user.avatarUrl}
          sx={{ 
            width: 30, 
            height: 30
          }}
        />
      );
    }
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
                  to="/profile"
                  sx={buttonStyle}
                >
                  Profile
                </Button>
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
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    mr: 2,
                    px: 1,
                    py: 0.5,
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  {getAvatarElement()}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      ml: 1, 
                      color: 'white',
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    {user?.username}
                  </Typography>
                </Box>
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