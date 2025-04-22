import React, { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

// Static default background as fallback
const DEFAULT_BACKGROUND = 'linear-gradient(135deg, #8e44ad 0%, #3498db 100%)';
// Fallback image as inline SVG for reliability
const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%238e44ad;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%233498db;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="800" height="800" fill="url(%23grad)"%3E%3C/rect%3E%3Cpath d="M0 0L800 800" stroke="%23ffffff20" stroke-width="15"%3E%3C/path%3E%3Cpath d="M800 0L0 800" stroke="%23ffffff20" stroke-width="15"%3E%3C/path%3E%3C/svg%3E';

const ThemeBackground: React.FC = () => {
  const { currentTheme } = useTheme();

  // Apply the background based on the current theme
  useEffect(() => {
    if (!currentTheme) return;
    
    console.log('ThemeBackground: Applying background from theme', currentTheme.name);

    // Get the image URL
    const imageUrl = currentTheme.background_url || currentTheme.image_url || FALLBACK_IMAGE;
    const isImageUrl = !imageUrl.startsWith('linear-gradient') && !imageUrl.startsWith('data:');
    const backgroundValue = isImageUrl ? `url(${imageUrl})` : imageUrl;
    
    try {
      // Apply CSS transition for smooth background changes
      const styleElement = document.createElement('style');
      styleElement.id = 'theme-transition-style';
      styleElement.textContent = `
        body {
          transition: background-image 1s ease-in-out;
        }
      `;
      
      // Remove existing transition style if it exists
      const existingStyle = document.getElementById('theme-transition-style');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      // Add the transition style
      document.head.appendChild(styleElement);
      
      // Set the background with a small delay to ensure transition works
      setTimeout(() => {
        // Set the background
        document.body.style.backgroundImage = backgroundValue;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center center';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundRepeat = 'no-repeat';
      }, 50);
    } catch (error) {
      console.error('Error applying theme background:', error);
      // Fallback to gradient
      document.body.style.backgroundImage = DEFAULT_BACKGROUND;
    }
    
    // Add a semi-transparent overlay for readability
    document.body.style.setProperty('--theme-overlay-color', 'rgba(0, 0, 0, 0.4)');
    document.documentElement.classList.add('theme-background-active');
    
    // Add overlay styles if they don't exist
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
          transition: background-color 1s ease-in-out;
        }
        
        .theme-background-active {
          position: relative;
        }
        
        .theme-background-active .MuiAppBar-root {
          background-color: rgba(33, 33, 33, 0.85) !important;
        }
      `;
      
      document.head.appendChild(styleElement);
    }
    
    // Return cleanup function
    return () => {
      // We don't actually clean up the background because it's needed by other components
      // Just log that we're unmounting
      console.log('ThemeBackground component unmounting');
    };
  }, [currentTheme]); // Re-run when the currentTheme changes

  // This component doesn't render anything visible
  return null;
};

export default ThemeBackground; 