import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Card, CardActionArea, CardMedia, CardContent, CircularProgress, Container, Tab, Tabs, Button, Skeleton } from '@mui/material';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import { Add } from '@mui/icons-material';
import { CreateThemeDialog } from '../components/theme';

// Import types from ThemeContext - we need to use the same types
interface Theme {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  background_url?: string;
  is_default?: boolean;
  is_premium?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CustomTheme extends Theme {
  user_id: string;
  is_public: boolean;
  prompt?: string;
}

// Fallback image as a data URI for broken images
const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%238e44ad;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%233498db;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="800" height="800" fill="url(%23grad)"%3E%3C/rect%3E%3Cpath d="M0 0L800 800" stroke="%23ffffff20" stroke-width="15"%3E%3C/path%3E%3Cpath d="M800 0L0 800" stroke="%23ffffff20" stroke-width="15"%3E%3C/path%3E%3C/svg%3E';

const ThemeSelector: React.FC = () => {
  // Use the theme context instead of local state
  const { 
    currentTheme,
    availableThemes, 
    customThemes, 
    publicCustomThemes,
    loadingThemes, 
    setActiveTheme,
    refreshThemes
  } = useTheme();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState<{[key: string]: boolean}>({});
  const [preloadStarted, setPreloadStarted] = useState(false);
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Preload images for standard themes
  useEffect(() => {
    if (!loadingThemes && availableThemes.length > 0 && !preloadStarted) {
      setPreloadStarted(true);
      
      // Start preloading standard theme images
      console.log('Preloading standard theme images...');
      availableThemes.forEach(theme => {
        const imageUrl = theme.background_url || theme.image_url;
        if (imageUrl) {
          const img = new Image();
          img.onload = () => {
            if (isMounted.current) {
              setImagesLoaded(prev => ({...prev, [theme.id]: true}));
            }
          };
          img.onerror = () => {
            console.warn(`Failed to preload image for theme: ${theme.name}`);
            if (isMounted.current) {
              setImagesLoaded(prev => ({...prev, [theme.id]: true})); // Mark as loaded anyway to remove skeleton
            }
          };
          img.src = imageUrl;
        }
      });
    }
  }, [availableThemes, loadingThemes, preloadStarted]);

  useEffect(() => {
    // Update loading state based on context loading state
    setLoading(loadingThemes);
    
    // Debug log for theme loading
    console.log('ThemeSelector - Themes available:', {
      standard: availableThemes.length,
      custom: customThemes.length,
      public: publicCustomThemes.length
    });
  }, [availableThemes, customThemes, publicCustomThemes, loadingThemes]);

  // Add a tab change effect to preload images for the selected tab
  useEffect(() => {
    // Move the preloading logic here and use conditional checks inside the effect
    if (tabValue === 1 && customThemes.length > 0) {
      // Preload custom theme images when tab is selected
      customThemes.forEach(theme => {
        const imageUrl = theme.background_url || theme.image_url;
        if (imageUrl && !imagesLoaded[theme.id]) {
          const img = new Image();
          img.onload = () => {
            if (isMounted.current) {
              setImagesLoaded(prev => ({...prev, [theme.id]: true}));
            }
          };
          img.src = imageUrl;
        }
      });
    } else if (tabValue === 2 && publicCustomThemes.length > 0) {
      // Preload public theme images when tab is selected
      publicCustomThemes.forEach(theme => {
        const imageUrl = theme.background_url || theme.image_url;
        if (imageUrl && !imagesLoaded[theme.id]) {
          const img = new Image();
          img.onload = () => {
            if (isMounted.current) {
              setImagesLoaded(prev => ({...prev, [theme.id]: true}));
            }
          };
          img.src = imageUrl;
        }
      });
    }
  }, [tabValue, customThemes, publicCustomThemes, imagesLoaded]);

  const handleThemeSelect = async (theme: Theme | CustomTheme) => {
    try {
      console.log('Selecting theme:', theme);
      
      // Use the context method to set the theme
      await setActiveTheme(theme.id);
      
      // Show success message
      toast.success(`${theme.name} theme applied!`);
    } catch (error) {
      console.error('Error applying theme:', error);
      toast.error('Failed to apply theme');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  // Render a grid of theme cards
  const renderThemeCards = (themes: (Theme | CustomTheme)[]) => {
    if (!themes || themes.length === 0) {
      // For custom themes tab, show a message with create button
      if (tabValue === 1) {
        return (
          <Box textAlign="center" my={4}>
            <Typography variant="h6" color="white" sx={{ mb: 2 }}>
              You don't have any custom themes yet
            </Typography>
            <Card 
              sx={{ 
                height: '280px', 
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                background: 'linear-gradient(135deg, rgba(66, 66, 74, 0.4) 0%, rgba(25, 25, 25, 0.6) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px dashed rgba(255, 255, 255, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                mx: 'auto',
                maxWidth: '350px',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3)',
                  '& .create-icon-circle': {
                    transform: 'scale(1.1)',
                    background: 'rgba(103, 58, 183, 0.9)',
                  },
                  '& .create-text': {
                    color: '#fff',
                    transform: 'translateY(5px)'
                  }
                }
              }}
              onClick={handleOpenCreateDialog}
            >
              <Box 
                className="create-icon-circle" 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(103, 58, 183, 0.7)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  mb: 3,
                  transition: 'all 0.3s ease'
                }}
              >
                <Add sx={{ fontSize: 48, color: 'white' }} />
              </Box>
              
              <Typography 
                className="create-text"
                variant="h6"
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 'medium',
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
              >
                Create New Theme
              </Typography>
              
              <Typography 
                className="create-text"
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  mt: 1,
                  maxWidth: '80%',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}
              >
                Design your own custom background
              </Typography>
            </Card>
          </Box>
        );
      }
      
      return (
        <Box textAlign="center" my={4}>
          <Typography variant="h6" color="text.secondary">
            No themes available in this category
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        margin: -2
      }}>
        {themes.map((theme) => {
          const isActive = currentTheme?.id === theme.id;
          const imageUrl = theme.background_url || theme.image_url;
          const isLoaded = imagesLoaded[theme.id] || tabValue !== 0;
          
          return (
            <Box 
              key={theme.id} 
              sx={{ 
                width: { xs: '100%', sm: '50%', md: '33.333%' }, 
                padding: 2
              }}
            >
              <Card 
                sx={{ 
                  height: '280px', 
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  border: isActive ? '2px solid #673ab7' : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: isActive 
                    ? '0 0 20px rgba(103, 58, 183, 0.5), 0 8px 16px rgba(0, 0, 0, 0.3)' 
                    : '0 8px 16px rgba(0, 0, 0, 0.2)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.4)',
                  }
                }}
              >
                <CardActionArea 
                  onClick={() => handleThemeSelect(theme)}
                  sx={{ 
                    height: '100%',
                    position: 'relative',
                    display: 'block'
                  }}
                >
                  {/* Show skeleton while image is loading */}
                  {!isLoaded && (
                    <Skeleton 
                      variant="rectangular" 
                      animation="wave" 
                      width="100%" 
                      height="100%"
                      sx={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        zIndex: 0
                      }}
                    />
                  )}
                  
                  {/* Full-size background image with loading optimization */}
                  <CardMedia
                    component="img"
                    image={imageUrl}
                    alt={theme.name}
                    loading={tabValue === 0 ? "eager" : "lazy"}
                    decoding="async"
                    onError={(e) => {
                      // Fallback for broken images using a data URI instead of external placeholder
                      const target = e.target as HTMLImageElement;
                      target.src = FALLBACK_IMAGE;
                      setImagesLoaded(prev => ({...prev, [theme.id]: true}));
                    }}
                    sx={{
                      height: '100%',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      objectFit: 'cover',
                      opacity: isLoaded ? 1 : 0.8,
                      transition: 'opacity 0.3s ease'
                    }}
                  />
                  
                  {/* Gradient overlay for better text visibility */}
                  <Box sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    top: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.8) 100%)',
                    zIndex: 1
                  }} />
                  
                  {/* Selection indicator */}
                  {isActive && (
                    <Box sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(77, 144, 254, 0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                      zIndex: 2
                    }}>
                      <Typography
                        component="span"
                        sx={{
                          fontSize: '1.2rem',
                          lineHeight: 1,
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      >
                        ✓
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Card content - positioned at the bottom for better readability */}
                  <CardContent sx={{ 
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 2,
                    pb: 3,
                    pt: 2,
                    background: 'transparent'
                  }}>
                    <Typography 
                      gutterBottom 
                      variant="h5" 
                      component="div"
                      sx={{
                        color: 'white',
                        fontWeight: 'bold',
                        textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                        mb: 0.5
                      }}
                    >
                      {theme.name}
                    </Typography>
                    {theme.description && (
                      <Typography 
                        variant="body2" 
                        sx={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                          maxWidth: '90%'
                        }}
                      >
                        {theme.description}
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
          );
        })}
        
        {/* In custom themes tab, add a card for creating a new theme */}
        {tabValue === 1 && (
          <Box 
            sx={{ 
              width: { xs: '100%', sm: '50%', md: '33.333%' }, 
              padding: 2
            }}
          >
            <Card 
              sx={{ 
                height: '280px', 
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                background: 'linear-gradient(135deg, rgba(66, 66, 74, 0.4) 0%, rgba(25, 25, 25, 0.6) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px dashed rgba(255, 255, 255, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                mx: 'auto',
                maxWidth: '350px',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3)',
                  '& .create-icon-circle': {
                    transform: 'scale(1.1)',
                    background: 'rgba(103, 58, 183, 0.9)',
                  },
                  '& .create-text': {
                    color: '#fff',
                    transform: 'translateY(5px)'
                  }
                }
              }}
              onClick={handleOpenCreateDialog}
            >
              <Box 
                className="create-icon-circle" 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(103, 58, 183, 0.7)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  mb: 3,
                  transition: 'all 0.3s ease'
                }}
              >
                <Add sx={{ fontSize: 48, color: 'white' }} />
              </Box>
              
              <Typography 
                className="create-text"
                variant="h6"
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 'medium',
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
              >
                Create New Theme
              </Typography>
              
              <Typography 
                className="create-text"
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  mt: 1,
                  maxWidth: '80%',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}
              >
                Design your own custom background
              </Typography>
            </Card>
          </Box>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
        sx={{
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          padding: 4,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}
      >
        <CircularProgress 
          size={60}
          thickness={4}
          sx={{ 
            color: '#4d90fe',
            mb: 3
          }} 
        />
        <Typography 
          variant="h6" 
          sx={{
            color: 'white',
            fontWeight: 'medium',
            textAlign: 'center',
            animation: 'pulse 2s infinite ease-in-out',
            '@keyframes pulse': {
              '0%': { opacity: 0.6 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0.6 }
            }
          }}
        >
          Loading Themes...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
      <Typography 
        variant="h4" 
        gutterBottom
        sx={{
          color: 'white',
          fontWeight: 'bold',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          mb: 3
        }}
      >
        Theme Selector
      </Typography>
      
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'rgba(255, 255, 255, 0.2)', 
        mb: 4,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        '& .MuiTabs-indicator': {
          display: 'none'
        }
      }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="theme categories"
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              marginRight: '24px',
              padding: '8px 16px',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              borderBottom: '2px solid transparent',
              '&.Mui-selected': {
                color: '#ffffff',
                fontWeight: 'bold',
                borderBottom: '2px solid #9333ea'
              },
              '&:hover': {
                color: '#ffffff',
                opacity: 1
              }
            }
          }}
        >
          <Tab label="Standard Themes" />
          <Tab label="Your Custom Themes" />
          <Tab label="Community Themes" />
        </Tabs>
      </Box>

      {tabValue === 0 && renderThemeCards(availableThemes)}
      {tabValue === 1 && renderThemeCards(customThemes)}
      {tabValue === 2 && renderThemeCards(publicCustomThemes)}
      
      {availableThemes.length === 0 && customThemes.length === 0 && publicCustomThemes.length === 0 && (
        <Box textAlign="center" mt={4}>
          <Typography 
            variant="h6"
            sx={{ color: 'white' }}
          >
            No themes are currently available.
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            mt={2}
          >
            Please check your connection to the server or contact an administrator.
          </Typography>
        </Box>
      )}
      
      {/* Theme creation dialog */}
      <CreateThemeDialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
      />
    </Container>
  );
};

export default ThemeSelector;