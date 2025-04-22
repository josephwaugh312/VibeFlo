import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { MusicPlayerProvider } from '../../contexts/MusicPlayerContext';
import { ThemeProvider } from '../../context/ThemeContext';

/**
 * Custom renderer that wraps components with necessary providers
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <MusicPlayerProvider>
            {children}
          </MusicPlayerProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

/**
 * Testing utility that wraps components with necessary providers
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

/**
 * Testing utility that wraps components with only the specified providers
 * @param providers Array of provider names to include ('auth', 'theme', 'musicPlayer', 'router')
 */
const renderWithProviders = (
  ui: ReactElement,
  providers: string[] = ['router', 'auth', 'theme', 'musicPlayer'],
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const getWrapper = () => {
    // Create wrapper function by composing providers
    const getComposedWrapper = () => {
      // Start with a component that just renders children
      let Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
      
      // Apply providers in reverse order (innermost first)
      [...providers].reverse().forEach(provider => {
        const CurrentWrapper = Wrapper;
        
        switch (provider) {
          case 'router':
            Wrapper = ({ children }) => (
              <BrowserRouter>
                <CurrentWrapper>{children}</CurrentWrapper>
              </BrowserRouter>
            );
            break;
          case 'auth':
            Wrapper = ({ children }) => (
              <AuthProvider>
                <CurrentWrapper>{children}</CurrentWrapper>
              </AuthProvider>
            );
            break;
          case 'theme':
            Wrapper = ({ children }) => (
              <ThemeProvider>
                <CurrentWrapper>{children}</CurrentWrapper>
              </ThemeProvider>
            );
            break;
          case 'musicPlayer':
            Wrapper = ({ children }) => (
              <MusicPlayerProvider>
                <CurrentWrapper>{children}</CurrentWrapper>
              </MusicPlayerProvider>
            );
            break;
        }
      });
      
      return Wrapper;
    };
    
    return getComposedWrapper();
  };
  
  return render(ui, { wrapper: getWrapper(), ...options });
};

/**
 * Mock data creators for common test scenarios
 */
const mockUser = {
  id: 1,
  name: 'Test User',
  username: 'testuser',
  email: 'test@example.com',
  avatar_url: 'https://example.com/avatar.jpg'
};

const mockPlaylist = {
  id: 1,
  name: 'Test Playlist',
  description: 'A test playlist',
  created_at: '2023-01-01T00:00:00.000Z',
  songs: [
    {
      id: 1,
      title: 'Test Song 1',
      artist: 'Test Artist',
      duration: 180,
      artwork: 'https://example.com/artwork1.jpg'
    },
    {
      id: 2,
      title: 'Test Song 2',
      artist: 'Another Artist',
      duration: 210,
      artwork: 'https://example.com/artwork2.jpg'
    }
  ]
};

const mockTheme = {
  id: 1,
  name: 'Test Theme',
  colors: {
    primary: '#3498db',
    secondary: '#2ecc71',
    background: '#f5f5f5',
    text: '#333333'
  }
};

const mockTodos = [
  { id: '1', text: 'Test Todo 1', completed: false },
  { id: '2', text: 'Test Todo 2', completed: true },
  { id: '3', text: 'Test Todo 3', completed: false }
];

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render, renderWithProviders, mockUser, mockPlaylist, mockTheme, mockTodos }; 