import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeBackground: React.FC = () => {
  const { currentTheme, loading } = useTheme();
  const [previousBgUrl, setPreviousBgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && currentTheme) {
      // Use type assertion to handle potential missing property
      const theme = currentTheme as any;
      const backgroundUrl = theme.background_url || theme.image_url;
      
      if (backgroundUrl) {
        // Create and apply transition styles if we're changing themes
        if (previousBgUrl && previousBgUrl !== backgroundUrl) {
          // Create a temporary overlay for the transition effect
          const transitionOverlay = document.createElement('div');
          transitionOverlay.id = 'theme-transition-overlay';
          transitionOverlay.style.position = 'fixed';
          transitionOverlay.style.top = '0';
          transitionOverlay.style.left = '0';
          transitionOverlay.style.width = '100%';
          transitionOverlay.style.height = '100%';
          transitionOverlay.style.backgroundImage = `url(${previousBgUrl})`;
          transitionOverlay.style.backgroundSize = 'cover';
          transitionOverlay.style.backgroundPosition = 'center center';
          transitionOverlay.style.backgroundAttachment = 'fixed';
          transitionOverlay.style.backgroundRepeat = 'no-repeat';
          transitionOverlay.style.opacity = '1';
          transitionOverlay.style.transition = 'opacity 0.8s ease';
          transitionOverlay.style.zIndex = '-1';
          
          document.body.appendChild(transitionOverlay);
          
          // Apply the new background to the body
          document.body.style.backgroundImage = `url(${backgroundUrl})`;
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundPosition = 'center center';
          document.body.style.backgroundAttachment = 'fixed';
          document.body.style.backgroundRepeat = 'no-repeat';
          
          // Fade out the overlay after a small delay
          setTimeout(() => {
            transitionOverlay.style.opacity = '0';
            
            // Remove the overlay after transition completes
            setTimeout(() => {
              if (document.body.contains(transitionOverlay)) {
                document.body.removeChild(transitionOverlay);
              }
            }, 800);
          }, 50);
        } else {
          // First time or same URL, just apply the background
          document.body.style.backgroundImage = `url(${backgroundUrl})`;
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundPosition = 'center center';
          document.body.style.backgroundAttachment = 'fixed';
          document.body.style.backgroundRepeat = 'no-repeat';
        }
        
        // Add a semi-transparent overlay to improve readability
        document.body.style.setProperty('--theme-overlay-color', 'rgba(0, 0, 0, 0.4)');
        document.documentElement.classList.add('theme-background-active');
        
        // Add custom CSS for the overlay
        if (!document.getElementById('theme-background-styles')) {
          const styleElement = document.createElement('style');
          styleElement.id = 'theme-background-styles';
          styleElement.textContent = `
            .theme-background-active::before {
              content: '';
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: var(--theme-overlay-color);
              z-index: -2;
              transition: background-color 0.5s ease;
            }
            
            .theme-background-active {
              position: relative;
            }
            
            .theme-background-active .MuiAppBar-root {
              background-color: rgba(33, 33, 33, 0.85) !important;
              transition: background-color 0.5s ease;
            }
            
            body {
              transition: background-image 0.8s ease;
            }
          `;
          
          document.head.appendChild(styleElement);
        }
        
        // Store the current background URL for next time
        setPreviousBgUrl(backgroundUrl);
      } else {
        // Reset background if no image is available
        resetBackground();
      }
    }
    
    // Clean up function to reset background when component unmounts
    return () => {
      resetBackground();
    };
  }, [currentTheme, loading, previousBgUrl]);
  
  const resetBackground = () => {
    document.body.style.backgroundImage = 'none';
    document.documentElement.classList.remove('theme-background-active');
    const styleElement = document.getElementById('theme-background-styles');
    if (styleElement) {
      styleElement.remove();
    }
    
    // Remove any transition overlays that might be present
    const transitionOverlay = document.getElementById('theme-transition-overlay');
    if (transitionOverlay && document.body.contains(transitionOverlay)) {
      document.body.removeChild(transitionOverlay);
    }
    
    setPreviousBgUrl(null);
  };

  // This component doesn't render anything visible
  return null;
};

export default ThemeBackground; 