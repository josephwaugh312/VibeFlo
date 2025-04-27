import React from 'react';
import { Box, Container, CssBaseline, Toolbar, Typography, Button } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

// Add an email verification banner
const VerificationBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  if (!user || user.is_verified === true) return null;
  
  return (
    <Box 
      sx={{ 
        bgcolor: 'warning.main', 
        color: 'warning.contrastText', 
        p: 1, 
        textAlign: 'center',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2
      }}
    >
      <Typography variant="body2">
        Please verify your email address to access all features.
      </Typography>
      <Button 
        variant="outlined" 
        size="small" 
        color="inherit" 
        onClick={() => navigate('/resend-verification')}
        sx={{ fontWeight: 'bold' }}
      >
        Resend Verification Email
      </Button>
    </Box>
  );
};

const MainLayout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Navbar />
      <VerificationBanner />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          pt: { xs: 2, sm: 3 },
          pb: { xs: 2, sm: 4 },
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar /> {/* Adds space for the fixed app bar */}
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </Box>
      <Footer />
    </Box>
  );
};

export default MainLayout; 