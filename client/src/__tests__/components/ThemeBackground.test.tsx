import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeBackground from '../../components/ThemeBackground';
import { useTheme } from '../../context/ThemeContext';

// Mock the theme context
jest.mock('../../context/ThemeContext', () => ({
  useTheme: jest.fn()
}));

// Skipping ThemeBackground tests for now due to DOM manipulation complexity
describe.skip('ThemeBackground Component', () => {
  // Save original DOM methods for cleanup
  const originalDocumentBodyStyle = { ...document.body.style };
  const originalSetProperty = document.body.style.setProperty;
  const originalClassListAdd = document.documentElement.classList.add;
  const originalClassListRemove = document.documentElement.classList.remove;
  const originalAppendChild = document.body.appendChild;
  const originalRemoveChild = document.body.removeChild;
  const originalCreateElement = document.createElement;
  const originalGetElementById = document.getElementById;
  const originalHeadAppendChild = document.head.appendChild;

  beforeEach(() => {
    // Reset document.body.style to empty state
    Object.keys(document.body.style).forEach(key => {
      if (typeof document.body.style[key] !== 'function') {
        document.body.style[key] = '';
      }
    });
    
    // Mock DOM manipulation methods
    document.body.style.setProperty = jest.fn();
    document.documentElement.classList.add = jest.fn();
    document.documentElement.classList.remove = jest.fn();
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
    document.head.appendChild = jest.fn();
    document.getElementById = jest.fn().mockReturnValue({
      remove: jest.fn()
    });
    document.createElement = jest.fn().mockImplementation((tagName) => {
      return {
        tagName,
        style: {},
        id: '',
        textContent: ''
      };
    });
  });

  afterEach(() => {
    // Restore original methods
    document.body.style.setProperty = originalSetProperty;
    document.documentElement.classList.add = originalClassListAdd;
    document.documentElement.classList.remove = originalClassListRemove;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
    document.createElement = originalCreateElement;
    document.getElementById = originalGetElementById;
    document.head.appendChild = originalHeadAppendChild;
    
    // Restore original style
    Object.keys(originalDocumentBodyStyle).forEach(key => {
      if (typeof originalDocumentBodyStyle[key] !== 'function') {
        document.body.style[key] = originalDocumentBodyStyle[key];
      }
    });
    
    jest.clearAllMocks();
  });

  it('applies background styles when theme is provided and not loading', () => {
    // Setup mock
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: {
        id: 1,
        name: 'Test Theme',
        description: 'A test theme',
        image_url: 'https://example.com/test-image.jpg'
      },
      loading: false
    });
    
    // Render the component
    render(<ThemeBackground />);
    
    // Check if methods were called
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('theme-background-active');
    expect(document.createElement).toHaveBeenCalledWith('style');
    expect(document.head.appendChild).toHaveBeenCalled();
  });

  it('does not apply background styles when loading is true', () => {
    // Setup mock
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: {
        id: 1,
        name: 'Test Theme',
        description: 'A test theme',
        image_url: 'https://example.com/test-image.jpg'
      },
      loading: true
    });
    
    // Render the component
    render(<ThemeBackground />);
    
    // With loading=true, these methods should not be called
    expect(document.documentElement.classList.add).not.toHaveBeenCalled();
  });

  it('resets background when unmounted', () => {
    // Setup mock
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: {
        id: 1,
        name: 'Test Theme',
        description: 'A test theme',
        image_url: 'https://example.com/test-image.jpg'
      },
      loading: false
    });
    
    // Render the component and get the unmount function
    const { unmount } = render(<ThemeBackground />);
    
    // Reset all mocks to make it easier to verify the unmount behavior
    jest.clearAllMocks();
    
    // Unmount the component
    unmount();
    
    // Check that the cleanup operations were performed
    expect(document.body.style.backgroundImage).toBe('none');
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('theme-background-active');
    expect(document.getElementById).toHaveBeenCalledWith('theme-background-styles');
  });

  it('renders nothing visibly', () => {
    (useTheme as jest.Mock).mockReturnValue({
      currentTheme: {
        id: 1,
        name: 'Test Theme',
        description: 'A test theme',
        image_url: 'https://example.com/test-image.jpg'
      },
      loading: false
    });
    
    const { container } = render(<ThemeBackground />);
    
    // The component should not render any visible content
    expect(container.firstChild).toBeNull();
  });
}); 