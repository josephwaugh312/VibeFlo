import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        color: 'white',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="body2" sx={{ mb: { xs: 1, sm: 0 } }}>
            © {new Date().getFullYear()} VibeFlo | All rights reserved
          </Typography>
          <Box sx={{ 
            display: 'flex',
            gap: 3
          }}>
            <Link href="/privacy" color="inherit" underline="hover">
              Privacy
            </Link>
            <Link href="/terms" color="inherit" underline="hover">
              Terms
            </Link>
            <Link href="/about" color="inherit" underline="hover">
              About
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 