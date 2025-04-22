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
  let getElementById: jest.SpyInstance;
  let createElement: jest.SpyInstance;
  let containsSpy: jest.SpyInstance;
  
  // Create real DOM elements for mocking
  const createMockDiv = () => {
    const div = document.createElement('div');
    // Add required properties for testing
    div.style.opacity = '1';
    return div;
  };

  const createMockStyle = () => {
    return document.createElement('style');
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
    appendChildSpy = jest.spyOn(document.body, 'appendChild');
    removeChildSpy = jest.spyOn(document.body, 'removeChild');
    setPropertySpy = jest.spyOn(document.body.style, 'setProperty');
    backgroundImageSpy = jest.spyOn(document.body.style, 'backgroundImage', 'set');
    
    // Mock getElementById
    getElementById = jest.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'theme-transition-overlay') {
        return null; // Default behavior: overlay doesn't exist yet
      }
      if (id === 'theme-background-styles') {
        return null; // Default: styles don't exist yet
      }
      return null;
    });
    
    // Mock createElement
    createElement = jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'style') return mockStyle;
      return mockDiv;
    });
    
    // Mock contains
    containsSpy = jest.spyOn(document.body, 'contains').mockReturnValue(false);
    
    // Mock classList methods
    document.documentElement.classList.add = jest.fn();
    document.documentElement.classList.remove = jest.fn();
    document.documentElement.classList.contains = jest.fn().mockReturnValue(false);
    
    // Mock document.head.appendChild
    jest.spyOn(document.head, 'appendChild').mockImplementation(() => mockStyle);
  });
  
  afterEach(() => {
    // Restore original methods
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  
  it('should not apply theme when loading is true', () => {
    // Mock getElementById to ensure consistent behavior
    getElementById.mockImplementation(() => null);
    
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: { background_url: 'test.jpg' },
      loading: true
    });
    
    render(<ThemeBackground />);
    
    // Verify no DOM changes were made while loading
    expect(backgroundImageSpy).not.toHaveBeenCalled();
    expect(setPropertySpy).not.toHaveBeenCalled();
    expect(document.documentElement.classList.add).not.toHaveBeenCalled();
  });
  
  it('should set theme when theme is available and not loading', () => {
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: { background_url: 'test.jpg' },
      loading: false
    });
    
    render(<ThemeBackground />);
    
    // Verify DOM was updated
    expect(backgroundImageSpy).toHaveBeenCalledWith('url(test.jpg)');
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('theme-background-active');
    expect(setPropertySpy).toHaveBeenCalledWith('--theme-overlay-color', 'rgba(0, 0, 0, 0.4)');
  });
  
  it('should use image_url if background_url is not available', () => {
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: { image_url: 'image.jpg' },
      loading: false
    });
    
    render(<ThemeBackground />);
    
    // Verify fallback to image_url
    expect(backgroundImageSpy).toHaveBeenCalledWith('url(image.jpg)');
  });
  
  it('should handle transition between different themes', () => {
    // Mock that we have a previous background URL
    const mockSetPreviousBgUrl = jest.fn();
    jest.spyOn(React, 'useState').mockImplementationOnce(() => ['first.jpg', mockSetPreviousBgUrl]);
    
    // Mock the overlay behavior for transition
    const mockOverlay = createMockDiv();
    mockOverlay.id = 'theme-transition-overlay';
    createElement.mockReturnValueOnce(mockOverlay);
    
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: { background_url: 'second.jpg' },
      loading: false
    });
    
    render(<ThemeBackground />);
    
    // Verify overlay was created
    expect(createElement).toHaveBeenCalledWith('div');
    expect(appendChildSpy).toHaveBeenCalled();
    
    // Fast-forward to trigger the first setTimeout (fade out)
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Now mock that the overlay is in the document for removal
    containsSpy.mockReturnValue(true);
    
    // Fast-forward to trigger the second setTimeout (removal)
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Verify overlay was eventually removed
    expect(removeChildSpy).toHaveBeenCalled();
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
      currentTheme: { background_url: 'test.jpg' },
      loading: false
    });
    
    render(<ThemeBackground />);
    
    // Verify style element was created and added
    expect(createElement).toHaveBeenCalledWith('style');
    expect(document.head.appendChild).toHaveBeenCalled();
  });
  
  it('should reset background when no image is available', () => {
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: { },  // Empty theme with no image
      loading: false
    });
    
    render(<ThemeBackground />);
    
    // Verify background was reset
    expect(backgroundImageSpy).toHaveBeenCalledWith('none');
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('theme-background-active');
  });
  
  it('should clean up on unmount', () => {
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: { background_url: 'test.jpg' },
      loading: false
    });
    
    const { unmount } = render(<ThemeBackground />);
    
    // Unmount component
    unmount();
    
    // Verify cleanup
    expect(backgroundImageSpy).toHaveBeenCalledWith('none');
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('theme-background-active');
  });
  
  it('should remove transition overlay during cleanup if present', () => {
    // Reset mocks to avoid interference from other tests
    jest.clearAllMocks();
    
    // Create a mock overlay element
    const mockOverlay = createMockDiv();
    mockOverlay.id = 'theme-transition-overlay';
    
    // Mock getElementById to return our overlay
    getElementById.mockImplementation((id) => {
      if (id === 'theme-transition-overlay') {
        return mockOverlay;
      }
      return null;
    });
    
    // Mock the contains method to return true, simulating that the overlay is in the document
    containsSpy.mockReturnValue(true);
    
    // Mock removeChild to avoid actual DOM operations
    removeChildSpy.mockImplementation(() => {
      return mockOverlay;
    });
    
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: { background_url: 'test.jpg' },
      loading: false
    });
    
    const { unmount } = render(<ThemeBackground />);
    
    // Unmount component
    unmount();
    
    // Verify overlay was removed by checking if removeChild was called
    expect(getElementById).toHaveBeenCalledWith('theme-transition-overlay');
    expect(containsSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });
  
  it('should render without crashing', () => {
    // This test simply verifies the component doesn't throw an error when rendered
    expect(() => {
      render(<ThemeBackground />);
    }).not.toThrow();
  });
}); 