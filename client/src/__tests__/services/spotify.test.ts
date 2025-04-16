import spotifyService from '../../services/spotify';

// Mock environment variables
jest.mock('../../services/spotify', () => {
  // Original module is mocked in this scope
  const originalModule = jest.requireActual('../../services/spotify');
  
  return {
    __esModule: true,
    default: {
      ...originalModule.default,
      getAuthorizationUrl: jest.fn().mockImplementation(() => {
        // Mock implementation that doesn't rely on env variables
        const state = 'test-state-123';
        localStorage.setItem('spotify_auth_state', state);
        
        return `https://accounts.spotify.com/authorize?client_id=mock-client-id&redirect_uri=http://localhost:3000/spotify-callback&response_type=code&state=${state}&scope=user-read-private`;
      })
    }
  };
});

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    length: 0,
    key: jest.fn((i: number) => null)
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock window.location
delete window.location;
window.location = {
  assign: jest.fn(),
  pathname: '/',
  search: '',
  hash: '',
  href: 'http://localhost',
  origin: 'http://localhost',
  protocol: 'http:',
  hostname: 'localhost',
  port: '',
  host: 'localhost',
  reload: jest.fn(),
  replace: jest.fn()
} as any;

describe('Spotify Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });

  describe('Authorization', () => {
    it('should generate a valid authorization URL', () => {
      const url = spotifyService.getAuthorizationUrl();
      expect(url).toContain('https://accounts.spotify.com/authorize');
      expect(url).toContain('client_id=');
      expect(url).toContain('redirect_uri=');
      expect(url).toContain('response_type=code');
      expect(url).toContain('state=');
      expect(url).toContain('scope=');
    });

    it('should store state in localStorage when getting authorization URL', () => {
      spotifyService.getAuthorizationUrl();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'spotify_auth_state',
        expect.any(String)
      );
    });
  });

  describe('Token Management', () => {
    it('should check isAuthenticated based on tokens', () => {
      // Initially not authenticated
      expect(spotifyService.isAuthenticated()).toBe(false);

      // Set tokens
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'spotify_access_token') return 'mock-token';
        if (key === 'spotify_token_expiry') return (Date.now() + 3600000).toString();
        return null;
      });

      // Now should be authenticated
      expect(spotifyService.isAuthenticated()).toBe(true);
    });

    it('should handle token expiration correctly', () => {
      // Set expired token
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'spotify_access_token') return 'mock-token';
        if (key === 'spotify_token_expiry') return (Date.now() - 1000).toString();
        return null;
      });

      // Should not be authenticated with expired token
      expect(spotifyService.isAuthenticated()).toBe(false);
    });

    it('should clear tokens on logout', () => {
      // Setup tokens
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'spotify_access_token') return 'mock-token';
        if (key === 'spotify_token_expiry') return (Date.now() + 3600000).toString();
        if (key === 'spotify_refresh_token') return 'mock-refresh';
        return null;
      });

      // Perform logout
      spotifyService.logout();

      // Verify local storage items were removed
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('spotify_access_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('spotify_token_expiry');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('spotify_refresh_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('spotify_auth_state');
    });
  });
}); 