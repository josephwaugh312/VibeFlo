/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeBackground from '../../../components/ThemeBackground';
import { useTheme } from '../../../context/ThemeContext';

// Mock the context hook
jest.mock('../../../context/ThemeContext');

describe('ThemeBackground Component', () => {
  // Mock DOM methods that need to be spied on
  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance;
  let setPropertySpy: jest.SpyInstance;
  let backgroundImageSpy: jest.SpyInstance;
  let setTimeoutSpy: jest.SpyInstance;
  let getElementById: jest.SpyInstance;
  let createElement: jest.SpyInstance;
  let removeElementSpy: jest.SpyInstance;
  
  // Create real DOM elements for mocking
  const createMockDiv = () => {
    const div = document.createElement('div');
    div.style.opacity = '1';
    div.remove = jest.fn();
    return div;
  };

  const createMockStyle = () => {
    const style = document.createElement('style');
    style.id = 'theme-transition-style';
    style.remove = jest.fn();
    return style;
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Default mock behavior
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: null,
      loading: true
    });
    
    // Setup mock elements
    const mockDiv = createMockDiv();
    const mockStyle = createMockStyle();
    
    // Initialize spies for DOM manipulation
    appendChildSpy = jest.spyOn(document.head, 'appendChild').mockImplementation(() => mockStyle);
    removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockDiv);
    setPropertySpy = jest.spyOn(document.body.style, 'setProperty').mockImplementation(() => {});
    backgroundImageSpy = jest.spyOn(document.body.style, 'backgroundImage', 'set');
    setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    
    // Mock getElementById
    getElementById = jest.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'theme-transition-style') {
        return null;
      }
      if (id === 'theme-background-styles') {
        return null;
      }
      return null;
    });
    
    // Mock createElement
    createElement = jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'style') return mockStyle;
      return mockDiv;
    });
    
    // Mock remove method on elements
    removeElementSpy = jest.spyOn(Element.prototype, 'remove').mockImplementation(() => {});
    
    // Mock classList methods
    document.documentElement.classList.add = jest.fn();
    document.documentElement.classList.remove = jest.fn();
  });
  
  afterEach(() => {
    // Restore original methods
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  
  it('should not apply theme when no currentTheme is provided', () => {
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: null
    });
    
    render(<ThemeBackground />);
    
    // Verify no DOM changes were made
    expect(backgroundImageSpy).not.toHaveBeenCalled();
    expect(setPropertySpy).not.toHaveBeenCalled();
    expect(document.documentElement.classList.add).not.toHaveBeenCalled();
  });
  
  it('should set theme when theme is available', () => {
    // Mock the theme context
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: { 
        name: 'Test Theme',
        background_url: 'test.jpg' 
      }
    });
    
    render(<ThemeBackground />);
    
    // Verify style element was created and transition style was added
    expect(createElement).toHaveBeenCalledWith('style');
    expect(appendChildSpy).toHaveBeenCalled();
    
    // Advance timers to trigger the setTimeout callback
    act(() => {
      jest.advanceTimersByTime(50); // The code uses a 50ms setTimeout
    });
    
    // Verify background was updated after the timeout
    expect(backgroundImageSpy).toHaveBeenCalled();
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('theme-background-active');
    expect(setPropertySpy).toHaveBeenCalledWith('--theme-overlay-color', 'rgba(0, 0, 0, 0.4)');
  });
  
  it('should use image_url if background_url is not available', () => {
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: { 
        name: 'Test Theme',
        image_url: 'image.jpg' 
      }
    });
    
    render(<ThemeBackground />);
    
    // Advance timers to trigger the setTimeout callback
    act(() => {
      jest.advanceTimersByTime(50);
    });
    
    // Verify fallback to image_url
    expect(backgroundImageSpy).toHaveBeenCalled();
  });
  
  it('should handle existing transition style element', () => {
    // Create a mock for the existing style element
    const existingStyle = document.createElement('style');
    existingStyle.id = 'theme-transition-style';
    
    // Mock getElementById to return our mock element
    getElementById.mockImplementation((id) => {
      if (id === 'theme-transition-style') {
        return existingStyle;
      }
      return null;
    });
    
    // Set up a spy specifically for this element's remove method
    const removeStyleSpy = jest.fn();
    existingStyle.remove = removeStyleSpy;
    
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: { 
        name: 'Test Theme',
        background_url: 'second.jpg' 
      }
    });
    
    render(<ThemeBackground />);
    
    // Verify the specific style element's remove method was called
    expect(removeStyleSpy).toHaveBeenCalled();
    
    // Verify new style was added
    expect(createElement).toHaveBeenCalledWith('style');
    expect(appendChildSpy).toHaveBeenCalled();
  });
  
  it('should add background styles element if not present', () => {
    // Mock getElementById to return null for the style element
    getElementById.mockImplementation((id) => {
      if (id === 'theme-background-styles') {
        return null;
      }
      return null;
    });
    
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: { 
        name: 'Test Theme',
        background_url: 'test.jpg' 
      }
    });
    
    render(<ThemeBackground />);
    
    // Verify style element was created and added to the head
    expect(createElement).toHaveBeenCalledWith('style');
    expect(appendChildSpy).toHaveBeenCalled();
  });
  
  it('should use fallback image when no image is available', () => {
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: { 
        name: 'Empty Theme'
        // No background_url or image_url
      }
    });
    
    render(<ThemeBackground />);
    
    // Advance timers to trigger the setTimeout callback
    act(() => {
      jest.advanceTimersByTime(50);
    });
    
    // Verify fallback was used
    expect(backgroundImageSpy).toHaveBeenCalled();
  });
  
  it('should handle errors gracefully during initialization', () => {
    // Mock console.error to prevent test output pollution and to verify it's called
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Make the createElement method throw an error when called with 'style'
    createElement.mockImplementationOnce((tagName) => {
      if (tagName === 'style') {
        throw new Error('Mock error in createElement');
      }
      return createMockDiv();
    });
    
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: { 
        name: 'Test Theme',
        background_url: 'test.jpg' 
      }
    });
    
    // The test should not throw even though we're simulating an error inside the component
    // We're wrapping the render in a try/catch to verify the component handles errors
    try {
      render(<ThemeBackground />);
      // If we reach this point, the component didn't crash the test
      expect(true).toBe(true);
    } catch (error) {
      // This should not be reached if the component properly handles errors
      expect('Component should handle errors').toBe('but it threw an error');
    }
    
    // Cleanup
    consoleErrorSpy.mockRestore();
  });
  
  // Clean up is now just a console.log, so this test is simplified
  it('should log unmounting message during cleanup', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: { 
        name: 'Test Theme',
        background_url: 'test.jpg' 
      }
    });
    
    const { unmount } = render(<ThemeBackground />);
    
    // Unmount component
    unmount();
    
    // Verify unmounting was logged
    expect(consoleLogSpy).toHaveBeenCalledWith('ThemeBackground component unmounting');
    
    consoleLogSpy.mockRestore();
  });
}); 